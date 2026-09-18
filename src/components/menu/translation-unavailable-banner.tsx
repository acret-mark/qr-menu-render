// FR-014: when a manually-selected language's content couldn't be fetched
// at all (distinct from a single missing field, which just falls back
// silently per FR-012) — shown once, not per-item, matching qr-menu-dev's
// TranslationUnavailableBanner intent.
export function TranslationUnavailableBanner() {
  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-[0.8rem] text-warning-foreground"
    >
      Showing the original menu text — a translation isn&apos;t available right now.
    </div>
  );
}
