import Link from "next/link";

// specs/025-footer-registration-cta. A plain Server Component — a single
// link, no client interactivity needed (research.md Decision 2). Rendered
// once at the bottom of /menu/[slug]/page.tsx's own document flow (not
// position:fixed), so it can never overlap the category tabs or any item
// card above it (FR-007) — it simply appears after them.
export function FooterRegistrationCta() {
  return (
    <footer className="shrink-0 bg-primary px-4 py-2.5 text-center text-[0.76rem] text-primary-foreground">
      <Link href="/register" className="no-underline">
        Want this smart digital menu for your food business?{" "}
        <strong className="font-heading">Grab yours now.</strong>
      </Link>
    </footer>
  );
}
