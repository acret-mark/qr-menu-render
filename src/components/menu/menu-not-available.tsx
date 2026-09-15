import { PackageX } from "lucide-react";

// specs/024-inactive-menu-state (restyling specs/007's original minimal
// placeholder — same single message covering every non-visible case
// uniformly, still never distinguishing which: nonexistent slug, wrong
// status, malformed path, per FR-002/FR-004). The `slug` prop is the
// literal attempted URL segment already in scope at both callers — never
// a lookup result, so it reveals nothing about whether that slug
// corresponds to a real business (research.md Decision 2).
export function MenuNotAvailable({ slug }: { slug: string }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PackageX size={30} strokeWidth={1.8} />
      </div>
      <h1 className="text-xl font-semibold">This menu isn&apos;t available right now</h1>
      <p className="max-w-[32ch] text-sm text-muted-foreground">
        The business may be updating their menu, or this QR code is no longer active. Please
        check with staff, or try again later.
      </p>
      <div className="mt-2 text-xs text-muted-foreground">/menu/{slug}</div>
    </div>
  );
}
