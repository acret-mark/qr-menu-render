import { and, asc, desc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { db } from "@/lib/db/client";
import { businesses, subscriptions, type planTypeEnum } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";
import { PLAN_PRICING } from "@/lib/subscriptions/pricing";
import { isWithinGrace } from "@/lib/subscriptions/expiry";

export type Subscription = typeof subscriptions.$inferSelect;
export type PlanType = (typeof planTypeEnum.enumValues)[number];

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

/**
 * specs/014-owner-subscription-tab: always INSERTs a new row — never
 * updates an existing one (FR-007/SC-003, research.md Decision 2).
 * Subscription history is multiple rows, one per payment attempt, by
 * design. `amount` is derived from PLAN_PRICING, never accepted as input
 * (FR-011) — mirrors adminGrantActiveSubscription/
 * adminGrantTrialSubscription's existing insert-only shape, from the
 * owner side instead of admin.
 */
export async function createOwnSubscription(
  ownerId: string,
  input: { plan: Exclude<PlanType, "trial">; paymentMethod: string; paymentProofUrl: string }
): Promise<Subscription | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [subscription] = await db
    .insert(subscriptions)
    .values({
      businessId: business.id,
      plan: input.plan,
      amount: PLAN_PRICING[input.plan],
      status: "pending",
      paymentMethod: input.paymentMethod,
      paymentProofUrl: input.paymentProofUrl,
    })
    .returning();
  return subscription;
}

// ---- Admin-scoped (contracts/data-access-layer.md category 2) ----
// Added here (T023/T026) rather than a separate file — subscriptions are a
// single-table concern and splitting owner/admin functions across files
// would separate closely related logic for no benefit.

export type PendingSubscriptionRow = Subscription & { businessName: string };

// Shared column selector for subscription+business-name joins (specs/012,
// specs/013) — avoids repeating the same explicit column list per query.
const SUBSCRIPTION_WITH_BUSINESS_NAME = {
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
} as const;

/**
 * specs/012-payment-queue: intentionally cross-tenant, no identity
 * parameter — trusted entirely by the caller having already verified
 * isAdmin (the admin (protected) layout's gate), same shape as
 * adminGetAllBusinesses. Ordered oldest-first (FR-006).
 */
export async function adminGetPendingSubscriptions(): Promise<PendingSubscriptionRow[]> {
  return db
    .select(SUBSCRIPTION_WITH_BUSINESS_NAME)
    .from(subscriptions)
    .innerJoin(businesses, eq(businesses.id, subscriptions.businessId))
    .where(eq(subscriptions.status, "pending"))
    .orderBy(asc(subscriptions.createdAt));
}

/**
 * specs/013-activate-subscription: fetches one subscription (any status —
 * the caller (payments/[id]/page.tsx) uses status to decide whether to
 * show the activate/reject form or an already-resolved state, FR-008).
 * Admin-scoped, no identity parameter, same trust model as
 * adminGetPendingSubscriptions above.
 */
export async function adminGetSubscriptionById(
  subscriptionId: string
): Promise<PendingSubscriptionRow | null> {
  const [row] = await db
    .select(SUBSCRIPTION_WITH_BUSINESS_NAME)
    .from(subscriptions)
    .innerJoin(businesses, eq(businesses.id, subscriptions.businessId))
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  return row ?? null;
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
 * specs/013-activate-subscription: completes qr-menu-dev's real
 * `activate_subscription` Postgres function (read directly from
 * `supabase/migrations/20260803000000_add_activate_subscription_fn.sql`),
 * not just its earlier partial approximation. No internal admin check
 * (FR-007's caller trust model, contracts/data-access-layer.md) — the
 * caller (an admin route that has already verified isAdmin) is trusted.
 *
 * Idempotent by construction (research.md Decision 1): the `WHERE
 * status = 'pending'` clause is the entire idempotency mechanism — an
 * already-active/expired/cancelled row simply matches zero rows and this
 * returns null, with no separate pre-check branch and no race window.
 *
 * Atomic (research.md Decision 2): the subscription and business updates
 * are wrapped in one db.transaction() — this project's first explicit use
 * of one — so a failure applying the business update rolls back the
 * subscription update too, reproducing the all-or-nothing guarantee
 * qr-menu-dev's Postgres function got for free from being one function call.
 */
export async function adminActivateSubscription(
  adminId: string,
  subscriptionId: string,
  plan: Exclude<PlanType, "trial">,
  startsAt: Date,
  expiresAt: Date
): Promise<Subscription | null> {
  const result = await db.transaction(async (tx) => {
    const [subscription] = await tx
      .update(subscriptions)
      .set({
        status: "active",
        plan,
        activatedBy: adminId,
        activatedAt: new Date(),
        startsAt,
        expiresAt,
      })
      .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.status, "pending")))
      .returning();

    if (!subscription) return null;

    const [business] = await tx
      .update(businesses)
      .set({ status: "active" })
      .where(eq(businesses.id, subscription.businessId))
      .returning({ slug: businesses.slug });

    return { subscription, slug: business?.slug };
  });

  if (!result) return null;
  // specs/026-menu-data-caching FR-003/FR-004/FR-009: activation flips the
  // business to active — the public menu's own availability depends on it.
  // Called after the transaction commits (updateTag is a cache API, not a
  // DB operation, so it doesn't belong inside the transaction).
  if (result.slug) updateTag(`menu:${result.slug}`);
  return result.subscription;
}

/**
 * specs/013-activate-subscription (research.md Decision 3): the "no"
 * branch of the same decision activation is the "yes" branch of. Reuses
 * the existing `cancelled` enum value — this schema has no distinct
 * "rejected" status, matching qr-menu-dev's own scope. Conditioned on
 * `status = 'pending'` for the same idempotency-by-construction reason as
 * activation, though a repeat rejection is a much lower-stakes no-op.
 * Touches only this one row — no transaction needed (no second table to
 * keep in sync).
 */
export async function adminRejectSubscription(subscriptionId: string): Promise<Subscription | null> {
  const [subscription] = await db
    .update(subscriptions)
    .set({ status: "cancelled" })
    .where(and(eq(subscriptions.id, subscriptionId), eq(subscriptions.status, "pending")))
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

/**
 * specs/020-unified-subscription-lifecycle, research.md Decision 4. A live
 * computation, never a stored count — a business is "locked" (for this
 * count's purposes) using the exact same rule as
 * src/lib/subscriptions/access-gate.ts's getSubscriptionAccess: its most
 * recent ever-activated subscription (expiresAt set) is not
 * status === "active" within grace. Groups all subscriptions by business in
 * one query (ordered so the first row seen per business is its most recent
 * activated one) rather than N+1 per-business reads.
 */
export async function adminGetExpiredBusinessCount(): Promise<number> {
  const rows = await db
    .select({
      businessId: subscriptions.businessId,
      status: subscriptions.status,
      expiresAt: subscriptions.expiresAt,
    })
    .from(subscriptions)
    .orderBy(desc(subscriptions.createdAt));

  const mostRecentActivatedByBusiness = new Map<string, { status: string; expiresAt: Date }>();
  for (const row of rows) {
    if (row.expiresAt === null) continue;
    if (!mostRecentActivatedByBusiness.has(row.businessId)) {
      mostRecentActivatedByBusiness.set(row.businessId, { status: row.status, expiresAt: row.expiresAt });
    }
  }

  let count = 0;
  for (const { status, expiresAt } of mostRecentActivatedByBusiness.values()) {
    if (!(status === "active" && isWithinGrace(expiresAt))) {
      count++;
    }
  }
  return count;
}
