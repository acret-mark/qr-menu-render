import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businesses, subscriptions, type planTypeEnum } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type Subscription = typeof subscriptions.$inferSelect;
type PlanType = (typeof planTypeEnum.enumValues)[number];

// Owner-read functions only (T019) — admin write functions
// (activate/grant*) are added in T023/T026 for User Story 3.

export async function getOwnSubscriptions(ownerId: string): Promise<Subscription[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, business.id))
    .orderBy(desc(subscriptions.createdAt));
}

export async function getOwnLatestSubscription(ownerId: string): Promise<Subscription | null> {
  const [latest] = await getOwnSubscriptions(ownerId);
  return latest ?? null;
}

// ---- Admin-scoped (contracts/data-access-layer.md category 2) ----
// Added here (T023/T026) rather than a separate file — subscriptions are a
// single-table concern and splitting owner/admin functions across files
// would separate closely related logic for no benefit.

export type PendingSubscriptionRow = Subscription & { businessName: string };

/**
 * specs/012-payment-queue: intentionally cross-tenant, no identity
 * parameter — trusted entirely by the caller having already verified
 * isAdmin (the admin (protected) layout's gate), same shape as
 * adminGetAllBusinesses. Ordered oldest-first (FR-006).
 */
export async function adminGetPendingSubscriptions(): Promise<PendingSubscriptionRow[]> {
  const rows = await db
    .select({
      id: subscriptions.id,
      businessId: subscriptions.businessId,
      plan: subscriptions.plan,
      amount: subscriptions.amount,
      status: subscriptions.status,
      paymentMethod: subscriptions.paymentMethod,
      paymentProofUrl: subscriptions.paymentProofUrl,
      activatedBy: subscriptions.activatedBy,
      activatedAt: subscriptions.activatedAt,
      startsAt: subscriptions.startsAt,
      expiresAt: subscriptions.expiresAt,
      reminderSentAt: subscriptions.reminderSentAt,
      expiryReminderSentAt: subscriptions.expiryReminderSentAt,
      createdAt: subscriptions.createdAt,
      businessName: businesses.name,
    })
    .from(subscriptions)
    .innerJoin(businesses, eq(businesses.id, subscriptions.businessId))
    .where(eq(subscriptions.status, "pending"))
    .orderBy(asc(subscriptions.createdAt));

  return rows;
}

export async function adminGetAllSubscriptionsForBusiness(
  businessId: string
): Promise<Subscription[]> {
  return db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.businessId, businessId))
    .orderBy(desc(subscriptions.createdAt));
}

/**
 * Reproduces qr-menu-dev's `activate_subscription` Postgres function's data
 * effect: promotes an existing *pending* subscription (created by the
 * owner's own payment-proof submission) to active. Unlike that function,
 * this performs **no internal admin check** (FR-007) — the caller
 * (an admin route/action that has already called requireAdmin()) is
 * trusted at this point, per contracts/data-access-layer.md.
 */
export async function adminActivateSubscription(
  adminId: string,
  subscriptionId: string
): Promise<Subscription | null> {
  const [subscription] = await db
    .update(subscriptions)
    .set({ status: "active", activatedBy: adminId, activatedAt: new Date() })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return subscription ?? null;
}

/**
 * Reproduces qr-menu-dev's `grant_active_subscription`: an admin-declared
 * paid-plan grant with no existing pending row required. No internal admin
 * check (FR-007) — same trust model as adminActivateSubscription above.
 */
export async function adminGrantActiveSubscription(
  adminId: string,
  businessId: string,
  plan: Exclude<PlanType, "trial">,
  expiresAt: Date
): Promise<Subscription> {
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      businessId,
      plan,
      amount: "0",
      status: "active",
      activatedBy: adminId,
      activatedAt: new Date(),
      startsAt: new Date(),
      expiresAt,
    })
    .returning();
  return subscription;
}

/**
 * Reproduces qr-menu-dev's `grant_trial_subscription`. No internal admin
 * check (FR-007) — same trust model as the two functions above.
 */
export async function adminGrantTrialSubscription(
  adminId: string,
  businessId: string,
  expiresAt: Date
): Promise<Subscription> {
  const [subscription] = await db
    .insert(subscriptions)
    .values({
      businessId,
      plan: "trial",
      amount: "0",
      status: "active",
      activatedBy: adminId,
      activatedAt: new Date(),
      startsAt: new Date(),
      expiresAt,
    })
    .returning();
  return subscription;
}
