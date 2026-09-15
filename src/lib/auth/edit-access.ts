import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getSubscriptionAccess } from "@/lib/subscriptions/access-gate";

export type EditAccessResult = { ok: true } | { ok: false; message: string };

const LOCKED_MESSAGE =
  "Your subscription has expired. Renew from the Subscription tab to keep editing your menu.";

/**
 * specs/020-unified-subscription-lifecycle, research.md Decision 3. Called
 * at the top of every owner-scoped *mutating* action (category/item
 * create/update/delete/reorder, sold-out toggle) — a server-side
 * enforcement of the read-only lock that a direct call bypassing the UI
 * cannot skip (FR-012, Constitution Principle II/V). A business with no
 * business row at all (edge case already handled by every caller's own
 * `getOwnBusiness` check) is not this function's concern — callers already
 * short-circuit on that before ever reaching here.
 */
export async function requireEditAccess(ownerId: string): Promise<EditAccessResult> {
  const business = await getOwnBusiness(ownerId);
  if (!business) {
    // No business to be locked out of — let the caller's own "no business"
    // handling take over; this function has nothing to add.
    return { ok: true };
  }

  const access = await getSubscriptionAccess(business.id);
  if (!access.full) {
    return { ok: false, message: LOCKED_MESSAGE };
  }

  return { ok: true };
}
