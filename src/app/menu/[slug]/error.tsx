"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Branded error boundary for the public menu route, matching
// qr-menu-dev's src/app/menu/[slug]/error.tsx. Deliberately its own small
// layout rather than the shared src/components/system/error-state.tsx —
// that component has no `reset`/digest support and targets a different
// audience (owner/admin "back to Hapag" flows), whereas this one offers a
// customer-facing retry of just this menu render, plus the error digest for
// support reference.
export default function MenuError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full flex h-dvh max-w-[430px] flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-muted text-muted-foreground">
          <TriangleAlert size={30} strokeWidth={1.8} />
        </div>
        <h1 className="text-xl">Something went wrong</h1>
        <p className="max-w-[32ch] text-sm text-muted-foreground">
          We couldn&rsquo;t load this menu. Please try again, or check back later.
        </p>
        {error.digest && (
          <div className="mt-2 text-xs text-muted-foreground">Error ref: {error.digest}</div>
        )}
        <Button className="mt-4" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
