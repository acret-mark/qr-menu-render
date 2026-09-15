import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness, type Business } from "@/lib/data-access/businesses";
import { getSubscriptionAccess } from "@/lib/subscriptions/access-gate";
import { OwnerHeader } from "@/components/dashboard/owner-header";
import { OwnerTabBar } from "@/components/dashboard/owner-tab-bar";
import { SubscriptionLockedBanner } from "@/components/dashboard/subscription-locked-banner";

// specs/028-error-500-state FR-010: the recognized business-lifecycle
// statuses. Anything else in the column (a data-integrity anomaly, not a
// normal lifecycle state) redirects to the generic error page below,
// rather than this layout/its children rendering incorrectly against an
// unrecognized value. TypeScript's own `Business["status"]` type can't
// catch this at runtime — it only constrains what the app itself ever
// writes, not what a row might already contain.
const RECOGNIZED_BUSINESS_STATUSES: readonly Business["status"][] = [
  "pending",
  "trial",
  "active",
  "suspended",
];

/**
 * Shared shell for every owner screen (specs/009-owner-dashboard-shell).
 * Consolidates the inline getCurrentUser()/redirect check each of
 * dashboard/categories/menu/qr used to duplicate on its own (FR-012).
 * Route group only — every URL under it is unchanged.
 *
 * specs/015-trial-expired-suspended: also gates on business status, the
 * first check this layout performs beyond session.
 *
 * specs/028-error-500-state FR-010: a missing business row or an
 * unrecognized status now redirects to `/error` — the generic error page,
 * not a thrown exception or a silently-incorrect render. This was
 * previously deferred (specs/009 Decision 3) to "a future error-state
 * spec"; this is that spec.
 *
 * specs/020-unified-subscription-lifecycle FR-011/FR-012/FR-014: after the
 * suspended-status hard gate above (a full block), this computes the
 * read-only lock (a live computation, never a stored value — FR-004) and
 * renders the persistent banner on every owner screen, not just the
 * dashboard page.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOwnBusiness(user.id);
  if (!business || !RECOGNIZED_BUSINESS_STATUSES.includes(business.status)) {
    redirect("/error");
  }

  if (business.status === "suspended") {
    redirect("/account-suspended");
  }

  const locked = !(await getSubscriptionAccess(business.id)).full;

  return (
    <div className="flex min-h-dvh flex-col">
      <OwnerHeader />
      {locked && <SubscriptionLockedBanner />}
      <main className="flex-1 pb-20">{children}</main>
      <OwnerTabBar />
    </div>
  );
}
