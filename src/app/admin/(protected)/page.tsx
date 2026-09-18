import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { adminGetAllBusinesses } from "@/lib/data-access/businesses";
import { adminGetExpiredBusinessCount } from "@/lib/data-access/subscriptions";
import { BusinessStatusBadge } from "@/components/admin/business-status-badge";
import { BusinessStatsSummary } from "@/components/admin/business-stats-summary";

function formatCreatedDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// specs/017-business-list — upgrades the bare-bones content specs/002/012
// left here into a dense table with status badges, a stat-card summary,
// and row-click navigation (research.md Decision 1: same file/URL,
// content-only change). Session gate lives in admin/(protected)/layout.tsx.
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // admin/(protected)/layout.tsx redirects unauthenticated/non-admin
  // visitors, but Next.js still evaluates this page concurrently with that
  // redirect — bail out quietly rather than asserting non-null; the
  // eventual response is the layout's redirect regardless (same pattern
  // established in specs/009).
  const user = await getCurrentUser();
  if (!user?.isAdmin) return null;

  const { q } = await searchParams;

  const [businesses, expired] = await Promise.all([
    adminGetAllBusinesses(),
    adminGetExpiredBusinessCount(),
  ]);

  // Stats always reflect every business, regardless of the search box above
  // (AdminShell) — only the table rows below are filtered, matching dev's
  // convention (specs/017-business-list).
  const total = businesses.length;
  const active = businesses.filter((b) => b.status === "active").length;
  const trial = businesses.filter((b) => b.status === "trial").length;
  const needsAttention = businesses.filter(
    (b) => b.status === "trial" || b.status === "pending"
  ).length;

  const trimmedQuery = q?.trim() ?? "";
  const filteredBusinesses = trimmedQuery
    ? businesses.filter((business) =>
        business.name.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
    : businesses;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Businesses</h1>
        <p className="text-sm text-muted-foreground">All registered Hapag accounts.</p>
      </div>

      <BusinessStatsSummary
        total={total}
        active={active}
        trial={trial}
        needsAttention={needsAttention}
        expired={expired}
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {businesses.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No businesses registered yet.
          </p>
        ) : filteredBusinesses.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No businesses match &ldquo;{trimmedQuery}&rdquo;.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Signed Up</th>
              </tr>
            </thead>
            <tbody>
              {filteredBusinesses.map((business) => {
                // Row-click via a wrapping Link per cell, not a client
                // onClick handler (research.md Decision 3) — a plain <a>
                // can't validly wrap a <tr>, so each cell's content is its
                // own block-level Link to the same destination instead.
                const href = `/admin/businesses/${business.id}`;
                return (
                  <tr
                    key={business.id}
                    className="border-b border-border last:border-none hover:bg-muted"
                  >
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5">
                        {business.name}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5 capitalize">
                        {business.plan}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5">
                        <BusinessStatusBadge status={business.status} />
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link href={href} className="block px-5 py-3.5">
                        {formatCreatedDate(business.createdAt)}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
