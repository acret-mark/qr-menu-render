import type { TermsSection } from "@/lib/marketing/terms-content";

/**
 * Table of contents for the Terms & Conditions page (FR-002).
 *
 * Reads only from `sections` (TERMS_SECTIONS) — no hand-listed titles of its
 * own — so it cannot drift out of sync with <TermsContent />, which renders
 * the exact same array (data-model.md). Same shape as the existing
 * <PrivacyToc /> (specs/031).
 */
export function TermsToc({ sections }: { sections: TermsSection[] }) {
  return (
    <nav
      aria-label="Terms & Conditions sections"
      className="mx-auto mb-12 max-w-[720px] rounded-[var(--mkt-radius-card)] border border-[var(--mkt-border)] bg-[var(--mkt-card)] p-6 min-[900px]:p-8"
    >
      <p className="mb-4 text-[0.8rem] font-bold tracking-wide text-[var(--mkt-muted)] uppercase">
        Jump to a section
      </p>
      <ol className="grid grid-cols-1 gap-2 text-[0.95rem] min-[640px]:grid-cols-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`} className="text-[var(--mkt-orange)] hover:underline">
              {section.number}. {section.heading}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
