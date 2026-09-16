"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/system/error-state";

// specs/028-error-500-state. Root error boundary: catches any unhandled
// render exception thrown anywhere under the root layout that doesn't
// already have a more specific boundary of its own (today, that's only
// `menu/[slug]/error.tsx`, specs/007/008, unchanged by this feature).
// Before this file existed, an owner-dashboard or admin-panel exception
// fell through to Next.js's own default handling instead of this app's
// generic, on-brand page.
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState onRetry={reset} />;
}
