import Link from "next/link";

// specs/025-footer-registration-cta. A plain Server Component — a single
// link, no client interactivity needed (research.md Decision 2). Rendered
// once at the bottom of /menu/[slug]/page.tsx's own document flow (not
// position:fixed), so it can never overlap the category tabs or any item
// card above it (FR-007) — it simply appears after them.
export function FooterRegistrationCta() {
  return (
    <footer className="shrink-0 bg-primary px-4 py-2.5 text-center text-xs text-primary-foreground">
      <Link href="/register">
        Want this smart digital menu for your food business?{" "}
        <strong className="font-semibold">Grab yours now.</strong>
      </Link>
    </footer>
  );
}
