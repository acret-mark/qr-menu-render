import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnCategories } from "@/lib/data-access/categories";
import { getOwnItems } from "@/lib/data-access/items";

// Manila-local time-of-day greeting, matching qr-menu-dev's dashboard page
// exactly — owners are Philippines-based, so the greeting is computed
// against Asia/Manila regardless of the server's own timezone.
function getManilaHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date)
  );
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Owner dashboard (specs/009-owner-dashboard-shell FR-001–FR-004, FR-010).
// Session gate now lives in (owner)/layout.tsx (FR-012) — this page only
// reads its own data. getOwnBusiness/getOwnCategories/getOwnItems already
// exist (specs/002/004/005); a business-less session isn't handled here
// (research.md Decision 3 — shouldn't occur for a real owner account).
export default async function DashboardPage() {
  // (owner)/layout.tsx redirects unauthenticated visitors, but Next.js still
  // evaluates this page concurrently with that redirect — bail out quietly
  // rather than asserting non-null; the eventual response is the layout's
  // redirect regardless.
  const user = await getCurrentUser();
  if (!user) return null;

  const business = await getOwnBusiness(user.id);

  const [categories, items] = await Promise.all([
    getOwnCategories(user.id),
    getOwnItems(user.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {business && (
        <p className="text-base">
          {getGreeting(getManilaHour(new Date()))}, {business.name}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/categories"
          className="rounded-lg border border-border p-4 hover:bg-muted"
        >
          <p className="text-3xl font-semibold tabular-nums">{categories.length}</p>
          <p className="text-sm text-muted-foreground">Categories</p>
        </Link>
        <Link
          href="/dashboard/menu"
          className="rounded-lg border border-border p-4 hover:bg-muted"
        >
          <p className="text-3xl font-semibold tabular-nums">{items.length}</p>
          <p className="text-sm text-muted-foreground">Items</p>
        </Link>
      </div>

      {business && (
        <Link
          href="/business-profile#subscription"
          className="rounded-lg border border-border p-4 hover:bg-muted"
        >
          <p className="font-medium">{business.name}</p>
          <p className="text-sm text-muted-foreground">
            {business.plan} plan · {business.status}
          </p>
        </Link>
      )}

      <Link href="/qr" className="rounded-lg border border-border p-4 hover:bg-muted">
        Download QR
      </Link>
    </div>
  );
}
