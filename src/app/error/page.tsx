import { ErrorState } from "@/components/system/error-state";

// specs/028-error-500-state FR-010/research.md Decision 3. The redirect
// target `(owner)/layout.tsx` (specs/009) points to when a signed-in
// owner's business record comes back missing or in an unrecognized status
// — a handled data state, not a thrown exception, so there is no error
// boundary to catch it; this is a real page at a stable URL instead. No
// `onRetry` — outside a Next.js error boundary there is no `reset()` to
// wire up, so "Try Again" falls back to a full page reload.
//
// Deliberately no `robots` metadata here (spec Clarifications/research.md
// Decision 6) — that belongs to the not-yet-ported search-engine-
// indexing-control feature, which will add it across every owner/admin/
// error route at once.
export default function ErrorPage() {
  return <ErrorState />;
}
