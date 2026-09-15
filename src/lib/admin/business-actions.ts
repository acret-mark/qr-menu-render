"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { adminSetStatusAndPlan, type Business } from "@/lib/data-access/businesses";

export type SetStatusAndPlanResult = { ok: true; business: Business } | { ok: false; reason: "not-found" };

/**
 * specs/019-admin-status-plan-override. requireAdmin() throws for a
 * non-admin caller (fail-closed, matching every other admin-scoped action
 * in this project) — the (protected) layout is the first gate, this is
 * defense in depth against a direct server-action call bypassing the UI
 * (Constitution Principle V). Never touches subscriptions or trialEndsAt
 * (FR-002/FR-007) — adminSetStatusAndPlan's write surface is exactly
 * businesses.status/plan.
 */
export async function setStatusAndPlanAction(
  businessId: string,
  status: Business["status"],
  plan: Business["plan"]
): Promise<SetStatusAndPlanResult> {
  await requireAdmin();

  const business = await adminSetStatusAndPlan(businessId, status, plan);
  if (!business) {
    return { ok: false, reason: "not-found" };
  }

  revalidatePath(`/admin/businesses/${businessId}`);
  revalidatePath("/admin");
  return { ok: true, business };
}
