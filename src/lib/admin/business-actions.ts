"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  adminGetBusinessById,
  adminSetStatusAndPlan,
  type Business,
} from "@/lib/data-access/businesses";
import {
  adminGetAllSubscriptionsForBusiness,
  adminGrantActiveSubscription,
  adminGrantTrialSubscription,
} from "@/lib/data-access/subscriptions";

export type SetStatusAndPlanResult = { ok: true; business: Business } | { ok: false; reason: "not-found" };

/**
 * specs/019-admin-status-plan-override, extended for
 * specs/032-unified-subscription-lifecycle (ported from qr-menu-dev's
 * setBusinessStatusAndPlan in src/lib/admin/actions.ts). requireAdmin()
 * throws for a non-admin caller (fail-closed, matching every other
 * admin-scoped action in this project) — the (protected) layout is the
 * first gate, this is defense in depth against a direct server-action call
 * bypassing the UI (Constitution Principle V).
 *
 * Unlike the original bare pass-through to adminSetStatusAndPlan, an
 * admin-granted "trial" or "active" status now also creates a real
 * `subscriptions` row — `subscriptions.expires_at` is the unified
 * lifecycle's sole expiry source of truth, so a business flipped to one of
 * those statuses with no subscription row would never be picked up by the
 * expiry cron and would sit at full access forever:
 *
 * - `status === "trial"`: grants a fresh trial subscription (one calendar
 *   month out, same fixed reference window as qr-menu-dev's own trial-grant
 *   clarification), which also sets `businesses.status = "trial"` as part
 *   of the same transaction (adminGrantTrialSubscription). `plan` is
 *   applied in a second, separate write since the grant has no plan
 *   parameter — mirrors qr-menu-dev exactly.
 * - `status === "active"`: only grants a fresh active subscription when
 *   there's no currently-live one (none, or the latest one isn't itself
 *   `active`) — otherwise this falls through to the plain direct write
 *   below, so a real, longer-dated paid subscription is never superseded
 *   by a $0 admin-override row. When a grant *is* needed,
 *   adminGrantActiveSubscription sets both `businesses.status` and
 *   `businesses.plan` itself in one transaction.
 * - Every other status (pending/suspended) keeps the original direct
 *   single-table write, unchanged — no subscriptions row is created or
 *   required there.
 */
export async function setStatusAndPlanAction(
  businessId: string,
  status: Business["status"],
  plan: Business["plan"]
): Promise<SetStatusAndPlanResult> {
  const admin = await requireAdmin();

  const existing = await adminGetBusinessById(businessId);
  if (!existing) {
    return { ok: false, reason: "not-found" };
  }

  let business: Business | null;

  if (status === "trial") {
    // One calendar month from grant time — the same fixed reference window
    // qr-menu-dev's trial-grant clarification established for admin-granted
    // trials.
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await adminGrantTrialSubscription(admin.id, businessId, expiresAt);
    // The grant already set businesses.status = "trial"; it has no plan
    // parameter, so plan is applied here in a second, separate write.
    business = await adminSetStatusAndPlan(businessId, "trial", plan);
  } else if (status === "active" && plan !== "trial") {
    const subscriptions = await adminGetAllSubscriptionsForBusiness(businessId);
    const hasLiveSubscription = subscriptions[0]?.status === "active";

    if (!hasLiveSubscription) {
      // Same fixed one-month reference window as the trial grant.
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      await adminGrantActiveSubscription(admin.id, businessId, plan, expiresAt);
      business = await adminGetBusinessById(businessId);
    } else {
      business = await adminSetStatusAndPlan(businessId, status, plan);
    }
  } else {
    business = await adminSetStatusAndPlan(businessId, status, plan);
  }

  if (!business) {
    return { ok: false, reason: "not-found" };
  }

  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath("/admin");
  return { ok: true, business };
}
