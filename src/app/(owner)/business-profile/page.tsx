import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { BusinessProfileForm } from "@/components/business-profile/business-profile-form";

// Standalone business profile screen (specs/010-business-profile-editing
// FR-011) — no Subscription/Support tab container (research.md Decision
// 1). Session gate lives in (owner)/layout.tsx (specs/009 FR-012).
export default async function BusinessProfilePage() {
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
        <h1 className="text-2xl font-semibold">Business Profile</h1>
        <p className="text-sm text-destructive">No business found for this account.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Business Profile</h1>
      <BusinessProfileForm
        business={{
          name: business.name,
          logoUrl: business.logoUrl,
          contactPhone: business.contactPhone,
          contactEmail: business.contactEmail,
          address: business.address,
        }}
      />
    </div>
  );
}
