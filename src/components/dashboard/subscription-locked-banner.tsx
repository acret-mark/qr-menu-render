import Link from "next/link";

// specs/020-unified-subscription-lifecycle FR-014. Persistent — rendered by
// (owner)/layout.tsx on every owner screen while locked, not just the
// dashboard page — distinct from status-banner.tsx's pending/trial nudge
// (a different signal: business.status, not this feature's live
// subscription-expiry computation).
export function SubscriptionLockedBanner() {
  return (
    <div className="flex flex-col gap-2 border-b border-destructive/20 bg-destructive/10 px-6 py-3 text-destructive sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium">
        Your subscription has expired. Renew to keep editing your menu.
      </p>
      <Link
        href="/business-profile#subscription"
        className="shrink-0 rounded-lg border border-destructive/30 px-3 py-1.5 text-center text-sm font-medium hover:bg-destructive/10"
      >
        Renew subscription
      </Link>
    </div>
  );
}
