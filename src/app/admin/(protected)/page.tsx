import { getCurrentUser } from "@/lib/auth/session";
import { adminGetAllBusinesses } from "@/lib/data-access/businesses";

// Admin business list (spec 002 T025/T027). Session gate now lives in
// admin/(protected)/layout.tsx (specs/012-payment-queue) — this page only
// reads its own data.
export default async function AdminPage() {
  // admin/(protected)/layout.tsx redirects unauthenticated/non-admin
  // visitors, but Next.js still evaluates this page concurrently with that
  // redirect — bail out quietly rather than asserting non-null; the
  // eventual response is the layout's redirect regardless (same pattern
  // established in specs/009).
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;

  const allBusinesses = await adminGetAllBusinesses();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Admin — All Businesses</h1>
      <p className="text-muted-foreground">Signed in as {user.email}</p>
      <div className="flex flex-col gap-2">
        {allBusinesses.map((business) => (
          <div key={business.id} className="rounded-lg border border-border p-4">
            <p className="font-medium">{business.name}</p>
            <p className="text-sm text-muted-foreground">
              {business.slug} · {business.status} · {business.plan}
            </p>
          </div>
        ))}
        {allBusinesses.length === 0 && (
          <p className="text-sm text-muted-foreground">No businesses yet.</p>
        )}
      </div>
    </div>
  );
}
