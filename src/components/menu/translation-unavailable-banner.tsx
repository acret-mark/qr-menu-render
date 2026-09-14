import { TriangleAlert } from "lucide-react";

// FR-014: when a manually-selected language's content couldn't be fetched
// at all (distinct from a single missing field, which just falls back
// silently per FR-012) — shown once, not per-item, matching qr-menu-dev's
// TranslationUnavailableBanner intent.
export function TranslationUnavailableBanner() {
  return (
    <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <TriangleAlert className="size-3.5 shrink-0" />
      <span>Showing the original menu text — a translation isn&apos;t available right now.</span>
    </div>
  );
}
