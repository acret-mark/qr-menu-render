import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { QrCodeView } from "@/components/qr/qr-code-view";

// QR Code screen (specs/006-qr-code-generation). No shared (owner) layout
// exists yet (research.md Decision 4, same as /categories, /menu) — this
// page checks its own session directly. getOwnBusiness is already
// owner-scoped (specs/002) — no new data-access function needed
// (research.md Decision 2).
export default async function QrPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

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
