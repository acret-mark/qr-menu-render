import { Skeleton } from "@/components/ui/skeleton";

// Mirrors MenuHeader/MenuSearch's own structure (hero + rounded-overlap
// panel, unbordered gap-6 item cards) so the loading state doesn't flash the
// pre-rebrand layout for a moment before real content swaps in
// (specs/026-menu-home-rebrand, ported here per the render visual-parity
// pass). The business's plan isn't known yet at this point, so the hero's
// language-selector placeholder always renders (a generic shape, not a
// decision about final content) rather than being conditionally shown/hidden.
export default function MenuLoading() {
  return (
    <div className="relative mx-auto w-full flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background">
      {/* Padding must match MenuHeader's hero exactly (px-4 pt-6 pb-14) —
          any difference here changes the hero's height, which visibly
          shifts everything below it (identity panel, search, tabs, list)
          the instant real content replaces this skeleton. Same for every
          other padding/margin value below: each is copied from the real
          component it stands in for, not approximated, since this swap
          happens after paint (unlike a pre-hydration flash) and a mismatch
          reads as the page's layout being briefly "wrong" before snapping
          into place. */}
      <div className="relative shrink-0 bg-primary px-4 pt-6 pb-14">
        {/* In-flow, matching MenuHeader's own `relative z-10 flex
            justify-end` wrapper around LanguageSelector — the business's
            plan isn't known yet at this point, so this placeholder always
            renders (a generic shape, not a decision about final content)
            rather than being conditionally shown. Being in-flow (not
            absolute) matters: it's what makes the real hero grow taller
            for a pro-plan business, and the skeleton needs to grow by the
            same amount or the swap to real content visibly shifts the
            layout. */}
        <div className="relative z-10 flex justify-end">
          <Skeleton className="h-[26px] w-14 rounded-full bg-white/40" />
        </div>
      </div>

      <div className="relative -mt-6 shrink-0 rounded-t-[28px] bg-card px-4 pt-8">
        <Skeleton className="mx-auto h-7 w-40" />
        <Skeleton className="mx-auto mt-1 h-3 w-28" />
      </div>

      <div className="shrink-0 bg-card px-4">
        <Skeleton className="mt-6 h-12 rounded-full" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <nav className="mt-2 border-b border-border px-4 py-3.5">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
            <Skeleton className="h-9 w-16 shrink-0 rounded-full" />
          </div>
        </nav>

        <ul className="flex flex-col gap-6 px-4 pb-6 pt-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex gap-4">
              <Skeleton className="h-32 w-32 shrink-0 rounded-2xl" />
              <div className="flex flex-1 flex-col gap-2 pt-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-2 h-5 w-16" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
