import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness, type Business } from "@/lib/data-access/businesses";
import { getSubscriptionAccess } from "@/lib/subscriptions/access-gate";
import { OwnerHeader } from "@/components/dashboard/owner-header";
import { OwnerTabBar } from "@/components/dashboard/owner-tab-bar";
import { StatusBanner } from "@/components/dashboard/status-banner";
import { SubscriptionLockedBanner } from "@/components/dashboard/subscription-locked-banner";

// specs/033-search-engine-indexing-control FR-007: covers
// dashboard/categories/qr/business-profile/support in one place, inherited
// by every page under this route group rather than repeated per page.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
 *
 * The "pending" status banner is likewise rendered here rather than only on
 * the dashboard page, matching qr-menu-dev's owner-shell.tsx — a business
 * awaiting payment verification needs the nudge on every owner screen it
 * visits, not just the one it happens to land on. "pending" and the
 * subscription-lock banner are mutually exclusive, same as dev: a pending
 * business shows the pending banner, never both.
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
    <div className="min-h-dvh bg-background px-4 pt-6 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <OwnerHeader businessName={business.name} />
        {business.status === "pending" && <StatusBanner status="pending" />}
        {business.status !== "pending" && locked && <SubscriptionLockedBanner />}
        {children}
      </div>
      <OwnerTabBar />
    </div>
  );
}
