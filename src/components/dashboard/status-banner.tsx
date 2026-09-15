// Pending/trial subscription-prompt banner (spec FR-008/FR-009). Matches
// qr-menu-dev's 016 spec text ("pending or trial") rather than its later
// shipped StatusBanner, whose BANNER_TEXT record has no "trial" entry — see
// research.md Decision 5. The link toward the subscription screen is
// visibly disabled since that screen doesn't exist in this project yet.
const BANNER_TEXT: Record<"pending" | "trial", string> = {
  pending: "Your account is awaiting payment verification.",
  trial: "You're on a free trial — complete your subscription to keep your menu live.",
};

export function StatusBanner({ status }: { status: string }) {
  if (status !== "pending" && status !== "trial") {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm">{BANNER_TEXT[status]}</p>
      <span
        aria-disabled="true"
        className="pointer-events-none shrink-0 rounded-lg border border-border px-3 py-1.5 text-center text-sm text-muted-foreground opacity-50"
      >
        Complete subscription
      </span>
    </div>
  );
}
