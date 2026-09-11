import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { adminGetAllBusinesses } from "@/lib/data-access/businesses";

// Minimal admin panel (spec 002 T025/T027) — proves adminGetAllBusinesses
// reaches every business regardless of owner, and that a non-admin session
// never reaches this page. The full admin panel (payment queue, ticket
// management, etc.) is a later, separate feature spec.
export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/admin/login");
  }

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
