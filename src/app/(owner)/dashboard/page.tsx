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
    <div className="flex flex-col gap-4">
      <h1 className="font-heading text-xl font-semibold">Dashboard</h1>

      {business && (
        <p className="text-base">
          {getGreeting(getManilaHour(new Date()))}, {business.name}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/categories"
          className="rounded-lg border border-border bg-card p-4 text-center"
        >
          <div className="font-heading text-2xl font-semibold">{categories.length}</div>
          <div className="text-sm text-muted-foreground">Categories</div>
        </Link>
        <Link
          href="/dashboard/menu"
          className="rounded-lg border border-border bg-card p-4 text-center"
        >
          <div className="font-heading text-2xl font-semibold">{items.length}</div>
          <div className="text-sm text-muted-foreground">Menu Items</div>
        </Link>
      </div>

      {business && (
        <Link
          href="/business-profile#subscription"
          className="rounded-lg border border-border bg-card p-4 text-sm"
        >
          <span className="text-muted-foreground">Plan:</span>{" "}
          <span className="font-medium capitalize">{business.plan}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="text-muted-foreground">Status:</span>{" "}
          <span className="font-medium capitalize">{business.status}</span>
        </Link>
      )}

      <Link
        href="/qr"
        className="flex h-11 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium"
      >
        Download QR
      </Link>
    </div>
  );
}
