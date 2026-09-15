"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// specs/028-error-500-state. Shared by every unhandled-failure surface in
// the app: the standalone `/error` page, the root `error.tsx` boundary,
// and `global-error.tsx`. One fixed message and action set, on purpose —
// no props beyond `onRetry`, so this can never assume or leak the audience
// (owner/customer/admin), the route it was reached from, or the underlying
// error's own message/stack (FR-002, FR-005). Callers that have an `Error`
// object are responsible for logging it themselves; this component never
// touches it.
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TriangleAlert size={30} strokeWidth={1.8} />
        </div>
        <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
        <p className="max-w-[32ch] text-sm text-muted-foreground">
          An unexpected error occurred on our end. Try again, or come back in a few minutes.
        </p>

        <Button
          className="mt-3 w-full max-w-[280px]"
          onClick={() => (onRetry ? onRetry() : location.reload())}
        >
          Try Again
        </Button>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline" }), "w-full max-w-[280px]")}
        >
          Back to Hapag
        </Link>
      </div>
    </div>
  );
}
