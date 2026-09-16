import Link from "next/link";
import type { PricingPlanEntry, TermsMeta, TermsSection } from "@/lib/marketing/terms-content";
import { CONTACT_EMAIL, PRICING_TABLE, PRIVACY_POLICY_HREF } from "@/lib/marketing/terms-content";

/**
 * Renders the full Terms & Conditions body (FR-001): all 20 sections in
 * order, each heading carrying the `id` <TermsToc /> links to, plus the
 * resolved effective/last-updated dates (FR-005) in place of the source
 * document's unresolved placeholders.
 *
 * `body` strings follow the conventions documented at the top of
 * terms-content.ts: "- " → bullet (consecutive bullets group into one <ul>),
 * "### " → sub-heading, "> " → highlighted callout, "{{PRIVACY_LINK}}" → a
 * working link to PRIVACY_POLICY_HREF, otherwise a plain paragraph. §5
 * additionally renders PRICING_TABLE right after its body text; §20
 * additionally renders CONTACT_EMAIL as a mailto link.
 */
export function TermsContent({
  sections,
  meta,
}: {
  sections: TermsSection[];
  meta: TermsMeta;
}) {
  return (
    <article className="mx-auto max-w-[720px] px-5 pb-24 min-[900px]:px-0">
      <header className="mb-10 text-center">
        <h1 className="text-[2.4rem] leading-[1.15]">Terms &amp; Conditions</h1>
        <p className="mt-3 text-[0.9rem] text-[var(--mkt-muted)]">
          Effective Date: {meta.effectiveDate} · Last Updated: {meta.lastUpdated}
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="mb-12 scroll-mt-24">
          <h2 className="mb-4 text-[1.6rem] leading-[1.2]">
            {section.number}. {section.heading}
          </h2>
          <SectionBody body={section.body} />
          {section.id === "5-subscription-plans-and-fees" && <PricingTable rows={PRICING_TABLE} />}
          {section.id === "20-contact-us" && (
            <p className="mt-2">
              Email:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-[var(--mkt-orange)] hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          )}
        </section>
      ))}
    </article>
  );
}

/** Renders a line's "our {{PRIVACY_LINK}}" token as a working link to /privacy (FR-009). */
function renderLineWithPrivacyLink(line: string): React.ReactNode {
  const token = "{{PRIVACY_LINK}}";
  const index = line.indexOf(token);
  if (index === -1) return line;

  return (
    <>
      {line.slice(0, index)}
      <Link href={PRIVACY_POLICY_HREF} className="text-[var(--mkt-orange)] hover:underline">
        Privacy Policy
      </Link>
      {line.slice(index + token.length)}
    </>
  );
}

function SectionBody({ body }: { body: string[] }) {
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  function flushBullets(key: string) {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="mb-4 list-disc space-y-1.5 pl-5">
        {bulletBuffer.map((item, i) => (
          <li key={i}>{renderLineWithPrivacyLink(item)}</li>
        ))}
      </ul>,
    );
    bulletBuffer = [];
  }

  body.forEach((line, i) => {
    if (line.startsWith("- ")) {
      bulletBuffer.push(line.slice(2));
      return;
    }
    flushBullets(`ul-${i}`);
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={i} className="mt-6 mb-2 text-[1.15rem]">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("> ")) {
      blocks.push(
        <p
          key={i}
          className="mb-4 rounded-[var(--mkt-radius-card)] bg-[var(--mkt-peach)] p-5 text-[0.95rem]"
        >
          {renderLineWithPrivacyLink(line.slice(2))}
        </p>,
      );
    } else {
      blocks.push(
        <p key={i} className="mb-4">
          {renderLineWithPrivacyLink(line)}
        </p>,
      );
    }
  });
  flushBullets("ul-end");

  return <>{blocks}</>;
}

function PricingTable({ rows }: { rows: PricingPlanEntry[] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-[var(--mkt-radius-card)] border border-[var(--mkt-border)]">
      <table className="w-full min-w-[480px] text-left text-[0.9rem]">
        <thead className="bg-[var(--mkt-card)]">
          <tr>
            <Th>Plan</Th>
            <Th>Monthly Fee</Th>
            <Th>What&apos;s Included</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.plan} className="border-t border-[var(--mkt-border)]">
              <Td>
                <strong>{row.plan}</strong>
              </Td>
              <Td>{row.monthlyFee}</Td>
              <Td>{row.included}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 font-bold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}
