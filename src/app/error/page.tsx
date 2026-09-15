import type { Metadata } from "next";
import { ErrorState } from "@/components/system/error-state";

// specs/028-error-500-state FR-010/research.md Decision 3. The redirect
// target `(owner)/layout.tsx` (specs/009) points to when a signed-in
// owner's business record comes back missing or in an unrecognized status
// — a handled data state, not a thrown exception, so there is no error
// boundary to catch it; this is a real page at a stable URL instead. No
// `onRetry` — outside a Next.js error boundary there is no `reset()` to
// wire up, so "Try Again" falls back to a full page reload.
//
// specs/033-search-engine-indexing-control FR-009 (the feature specs/028's
// own comment above deferred this to).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ErrorPage() {
  return <ErrorState />;
}
