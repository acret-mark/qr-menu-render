export const metadata = { title: "Privacy Policy — Hapag" };

/**
 * specs/030-marketing-homepage FR-021. Minimal, honest placeholder — real
 * content is specs/031-privacy-policy's own scope (Clarifications), not
 * this feature's. Exists only so the footer's "Privacy Policy" link
 * resolves to something real rather than a 404.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-muted-foreground">
        Hapag&apos;s full privacy policy is being finalized, consistent with Philippine
        data-privacy expectations. In the meantime, contact us directly with any questions about
        how your data is handled.
      </p>
    </main>
  );
}
