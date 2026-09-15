import { adminGetAllSubscriptionsForBusiness } from "@/lib/data-access/subscriptions";
import { graceDeadline, isWithinGrace } from "./expiry";

export type SubscriptionAccess = { full: true } | { full: false; lockedSince: string };

/**
 * Shared server-side read-only-lock check for specs/020-unified-
 * subscription-lifecycle. Every owner-dashboard surface that must be
 * blocked when locked (menu/category/item edit actions, Pro-tier feature
 * entry points) calls this rather than re-deriving the grace-period math
 * itself, so the gate and the cron
 * (src/app/api/cron/subscription-expiry/route.ts) can never drift apart on
 * what "locked" means.
 *
 * Considers only the most recent subscription row that has ever been
 * activated (`expiresAt` set) — NOT simply the most recent row overall
 * (research.md Decision 5, a deviation from a literal port of qr-menu-dev's
 * own "most recent row" query, found necessary during implementation).
 * `createOwnSubscription` (specs/014) is insert-only: a renewal payment
 * always creates a brand-new row with `expiresAt = null` until an admin
 * activates it (specs/013). A naive "most recent row" query would break
 * two of this spec's own acceptance scenarios: (a) a business's very first
 * payment submission (pending, `expiresAt` null, no prior subscription)
 * would incorrectly lock a business that was never previously restricted —
 * spec.md's own "no subscription row: not eligible for the lockout gate
 * either way" edge case, extended to "no *activated* subscription row
 * either"; (b) an already-locked business's pending renewal submission
 * would incorrectly appear as the "latest" row and read as `full: true`
 * (since it isn't `active`+`past grace`, just not-yet-activated) —
 * contradicting User Story 3 Scenario 3's explicit "submitting a proof
 * alone doesn't reset or extend grace." Skipping straight to the most
 * recent row that DOES have `expiresAt` set sidesteps both: a fresh
 * business or a pending-and-never-yet-activated submission has no such
 * row (full access); an already-locked business's still-expired row
 * remains the one this gate reads until an admin actually activates the
 * new one (still locked, exactly as spec'd).
 *
 * Read-only: never writes businesses/subscriptions. Only the cron
 * transitions a subscription into the expired state.
 */
export async function getSubscriptionAccess(businessId: string): Promise<SubscriptionAccess> {
  const subscriptions = await adminGetAllSubscriptionsForBusiness(businessId);
  const mostRecentActivated = subscriptions.find((s) => s.expiresAt !== null) ?? null;

  if (!mostRecentActivated || !mostRecentActivated.expiresAt) {
    return { full: true };
  }

  // research.md Decision 1: only status === "active" is ever treated as
  // live — qr-menu-dev's own dead "trial"-status branch is dropped, since
  // a trial subscription in this project's landed schema is
  // plan === "trial" with status === "active", never status === "trial".
  if (mostRecentActivated.status === "active" && isWithinGrace(mostRecentActivated.expiresAt)) {
    return { full: true };
  }

  return { full: false, lockedSince: graceDeadline(mostRecentActivated.expiresAt).toISOString() };
}
