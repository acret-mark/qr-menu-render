import Link from "next/link";

// Pending-subscription banner (specs/020-unified-subscription-lifecycle).
// Matches qr-menu-dev's currently-shipped status-banner.tsx, not the older
// pre-merge "pending or trial" spec text this file previously implemented
// (see git history) — dev's BANNER_TEXT record only ever had a "pending"
// entry, and its link to /business-profile#subscription is real (that tab
// exists in both apps), not permanently disabled.
const BANNER_TEXT: Record<"pending", string> = {
  pending: "Your account is awaiting payment verification.",
};

export function StatusBanner({ status }: { status: "pending" }) {
  return (
    <div className="flex flex-col gap-2 border-b border-warning/30 bg-warning/10 px-6 py-3 text-warning-foreground sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">{BANNER_TEXT[status]}</p>
      <Link
        href="/business-profile#subscription"
        className="shrink-0 rounded-lg border border-warning/30 px-3 py-1.5 text-center text-sm font-medium hover:bg-warning/10"
      >
        Complete your subscription
      </Link>
    </div>
  );
}
