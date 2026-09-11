import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";

// Minimal dashboard shell (spec 002 T016) — gated on an active session.
// The full owner dashboard (menu builder, QR generation, etc.) is out of
// scope here; those are later, separate feature specs.
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOwnBusiness(user.id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">Signed in as {user.email}</p>
      {business ? (
        <div className="rounded-lg border border-border p-4">
          <p className="font-medium">{business.name}</p>
          <p className="text-sm text-muted-foreground">Status: {business.status}</p>
        </div>
      ) : (
        <p className="text-sm text-destructive">No business found for this account.</p>
      )}
    </div>
  );
}
