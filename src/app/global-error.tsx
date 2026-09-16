"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/system/error-state";
import "./globals.css";

// specs/028-error-500-state. The one case `error.tsx` cannot catch: the
// root layout itself throwing. Next.js requires this file to render its
// own <html>/<body> — it fully replaces the root layout when active, so
// styling has to be re-imported here rather than inherited (this is the
// rarest surface this feature covers; font loading is intentionally
// skipped for simplicity, matching plan.md's Constraints).
export default function GlobalError({
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ErrorState onRetry={reset} />
      </body>
    </html>
  );
}
