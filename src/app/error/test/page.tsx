import type { Metadata } from "next";
import { notFound } from "next/navigation";

// specs/033-search-engine-indexing-control FR-009.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// specs/028-error-500-state FR-007/research.md Decision 4. Dev-only
// verification aid — throws for real, so visiting this route in
// development exercises the actual throw → nearest error.tsx boundary →
// ErrorState pipeline, not just a re-render of /error's static content.
// Gated out of production via next/navigation's notFound() — the first
// use of that function in this project (every other "not found" case so
// far renders its own inline message instead, e.g. specs/018's business
// detail page) — chosen here because a genuine 404 is exactly the correct
// production behavior for a route that must not exist at all outside
// development, not merely a state to render a friendlier message for.
export default function ForceErrorTestPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  throw new Error("Forced error for specs/028-error-500-state dev verification");
}
