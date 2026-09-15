export const metadata = { title: "Terms & Conditions — Hapag" };

/**
 * specs/030-marketing-homepage FR-021. Minimal, honest placeholder — no
 * legal Terms content exists anywhere in this project yet; real content is
 * specs/032-terms-conditions's own scope (Clarifications), not this
 * feature's. Exists only so the footer's "Terms & conditions" link
 * resolves to something real rather than a 404.
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold">Terms &amp; Conditions</h1>
      <p className="mt-4 text-muted-foreground">
        Hapag&apos;s full terms of service are being finalized. In the meantime, contact us
        directly with any questions about using the platform.
      </p>
    </main>
  );
}
