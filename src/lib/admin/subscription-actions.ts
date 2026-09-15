"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/session";
import {
  adminActivateSubscription,
  adminRejectSubscription,
  type PlanType,
  type Subscription,
} from "@/lib/data-access/subscriptions";
import { adminGetBusinessById } from "@/lib/data-access/businesses";
import { sendActivationConfirmationEmail } from "@/lib/email/send-activation-confirmation";

export type ActivateSubscriptionResult =
  | { ok: true; subscription: Subscription; emailSent: boolean }
  | { ok: false; reason: "not-pending" };

/**
 * specs/013-activate-subscription. requireAdmin() throws for a non-admin
 * caller (fail-closed, matching every other admin-scoped action in this
 * project) — the (protected) layout is the first gate, this is defense in
 * depth against a direct server-action call bypassing the UI (Constitution
 * Principle V).
 */
export async function activateSubscriptionAction(
  subscriptionId: string,
  plan: Exclude<PlanType, "trial">,
  startsAt: Date,
  expiresAt: Date
): Promise<ActivateSubscriptionResult> {
  const admin = await requireAdmin();

  const subscription = await adminActivateSubscription(admin.id, subscriptionId, plan, startsAt, expiresAt);
  if (!subscription) {
    return { ok: false, reason: "not-pending" };
  }

  // Email is a notification of a change that already happened (FR-011) —
  // its failure never blocks or reverses the activation already committed
  // above.
  let emailSent = true;
  try {
    const business = await adminGetBusinessById(subscription.businessId);
    const [owner] = business
      ? await db.select({ email: users.email }).from(users).where(eq(users.id, business.ownerId)).limit(1)
      : [];

    if (business && owner) {
      const result = await sendActivationConfirmationEmail({
        toEmail: owner.email,
        businessName: business.name,
        plan: subscription.plan,
      });
      emailSent = result.ok;
    } else {
      emailSent = false;
    }
  } catch (err) {
    console.error("activateSubscriptionAction: failed to send confirmation email", err);
    emailSent = false;
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${subscriptionId}`);
  return { ok: true, subscription, emailSent };
}

export type RejectSubscriptionResult = { ok: true } | { ok: false; reason: "not-pending" };

export async function rejectSubscriptionAction(subscriptionId: string): Promise<RejectSubscriptionResult> {
  await requireAdmin();

  const subscription = await adminRejectSubscription(subscriptionId);
  if (!subscription) {
    return { ok: false, reason: "not-pending" };
  }

  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${subscriptionId}`);
  return { ok: true };
}
