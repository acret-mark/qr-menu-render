import type {
  CookieEntry,
  PolicyMeta,
  PolicySection,
  SubProcessorEntry,
} from "@/lib/marketing/privacy-content";
import { COOKIE_TABLE, SUB_PROCESSOR_TABLE } from "@/lib/marketing/privacy-content";

/**
 * Renders the full Privacy Policy body (FR-001, FR-009): all 15 sections in
 * order, each heading carrying the `id` <PrivacyToc /> links to, plus the
 * resolved effective/last-updated dates and contact channel (FR-005, FR-006)
 * in place of the source document's unresolved placeholders.
 *
 * `body` strings follow the conventions documented at the top of
 * privacy-content.ts: "- " → bullet (consecutive bullets group into one
 * <ul>), "### " → sub-heading, "> " → highlighted callout, otherwise a plain
 * paragraph. §7 and §8 additionally render their source tables (cookies,
 * sub-processors) right after their body text.
 */
export function PrivacyContent({
  sections,
  meta,
}: {
  sections: PolicySection[];
  meta: PolicyMeta;
}) {
  return (
    <article className="mx-auto max-w-[720px] px-5 pb-24 min-[900px]:px-0">
      <header className="mb-10 text-center">
        <h1 className="text-[2.4rem] leading-[1.15]">Privacy Policy</h1>
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
          {section.id === "7-cookies-and-similar-technologies" && (
            <CookieTable rows={COOKIE_TABLE} />
          )}
          {section.id === "8-how-we-share-your-information" && (
            <SubProcessorTable rows={SUB_PROCESSOR_TABLE} />
          )}
          {section.id === "15-contact-us" && (
            <p className="mt-2">
              Email:{" "}
              <a href={`mailto:${meta.contactEmail}`} className="text-[var(--mkt-orange)] hover:underline">
                {meta.contactEmail}
              </a>
            </p>
          )}
        </section>
      ))}
    </article>
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
          <li key={i}>{item}</li>
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
          {line.slice(2)}
        </p>,
      );
    } else {
      blocks.push(<p key={i} className="mb-4">{line}</p>);
    }
  });
  flushBullets("ul-end");

  return <>{blocks}</>;
}

function CookieTable({ rows }: { rows: CookieEntry[] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-[var(--mkt-radius-card)] border border-[var(--mkt-border)]">
      <table className="w-full min-w-[480px] text-left text-[0.9rem]">
        <thead className="bg-[var(--mkt-card)]">
          <tr>
            <Th>Cookie</Th>
            <Th>Purpose</Th>
            <Th>Duration</Th>
            <Th>Type</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-[var(--mkt-border)]">
              <Td><code>{row.name}</code></Td>
              <Td>{row.purpose}</Td>
              <Td>{row.duration}</Td>
              <Td>{row.type}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubProcessorTable({ rows }: { rows: SubProcessorEntry[] }) {
  return (
    <div className="mb-4 overflow-x-auto rounded-[var(--mkt-radius-card)] border border-[var(--mkt-border)]">
      <table className="w-full min-w-[480px] text-left text-[0.9rem]">
        <thead className="bg-[var(--mkt-card)]">
          <tr>
            <Th>Category of Provider</Th>
            <Th>Purpose</Th>
            <Th>Data Involved</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category} className="border-t border-[var(--mkt-border)]">
              <Td>{row.category}</Td>
              <Td>{row.purpose}</Td>
              <Td>{row.dataInvolved}</Td>
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
