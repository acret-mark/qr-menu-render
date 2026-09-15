import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// specs/030-marketing-homepage FR-005. Decorative iPhone-bezel wrapper —
// CSS/border only, no external asset dependency. Used by /demo (framed
// variant) and the hero's desktop visual reference. Purely presentational.
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[9/19.5] w-full max-w-[380px] overflow-hidden rounded-[2.75rem] border-[10px] border-[var(--mkt-ink,#1b1b18)] bg-[var(--mkt-ink,#1b1b18)] shadow-[var(--mkt-shadow-md,0_16px_32px_-8px_rgba(0,0,0,0.35))]",
        className
      )}
    >
      <div className="absolute top-0 left-1/2 z-10 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[var(--mkt-ink,#1b1b18)]" />
      <div className="h-full w-full overflow-hidden rounded-[2rem] bg-white">{children}</div>
    </div>
  );
}
