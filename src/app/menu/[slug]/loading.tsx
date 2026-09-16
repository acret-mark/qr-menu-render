// specs/034-performance-optimization-pass FR-010/research.md Decision 2 —
// the one route-level skeleton this architecture needs (item detail/search
// are in-page state changes with no fetch of their own to skeleton over,
// per specs/008). A Server Component: zero client JS cost. Every box below
// is sized to match its real counterpart exactly (MenuHeader's h-40 hero +
// -mt-6 card overlap, MenuSearch's search-input row, CategoryTabs' pill row,
// MenuItemCard's size-16 thumbnail + two text lines) so the real content
// swaps in without a layout shift.
export default function MenuLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col animate-pulse">
      <div className="flex flex-col">
        <div className="h-40 bg-muted" />
        <div className="-mt-6 rounded-t-[28px] bg-card px-4 pb-2 pt-6">
          <div className="mx-auto h-6 w-40 rounded bg-muted" />
        </div>
      </div>

      <div className="shrink-0 px-4 py-3">
        <div className="h-10 w-full rounded-full bg-muted" />
      </div>

      <div className="flex shrink-0 gap-2 overflow-hidden border-b border-border px-4 py-3">
        <div className="h-8 w-20 shrink-0 rounded-full bg-muted" />
        <div className="h-8 w-24 shrink-0 rounded-full bg-muted" />
        <div className="h-8 w-16 shrink-0 rounded-full bg-muted" />
      </div>

      <div className="flex flex-col px-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex w-full gap-3 py-3">
            <div className="size-16 shrink-0 rounded-lg bg-muted" />
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
