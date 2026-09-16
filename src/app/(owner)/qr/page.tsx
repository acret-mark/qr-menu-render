import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { QrCodeView } from "@/components/qr/qr-code-view";

// QR Code screen (specs/006-qr-code-generation). Session gate now lives in
// (owner)/layout.tsx (specs/009 FR-012). getOwnBusiness is already
// owner-scoped (specs/002).
export default async function QrPage() {
  // (owner)/layout.tsx redirects unauthenticated visitors, but Next.js still
  // evaluates this page concurrently with that redirect — bail out quietly
  // rather than asserting non-null; the eventual response is the layout's
  // redirect regardless.
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await getOwnBusiness(user.id);
  if (!business) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">QR Code</h1>
        <p className="text-sm text-destructive">No business found for this account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">QR Code</h1>
      <QrCodeView name={business.name} slug={business.slug} />
    </div>
  );
}
