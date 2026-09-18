import { adminGetAllSupportTickets } from "@/lib/data-access/support-tickets";
import { adminGetAllBusinesses } from "@/lib/data-access/businesses";
import { SupportInbox, type SupportInboxRow } from "@/components/admin/support-inbox";

// specs/021-support-ticket-management. Session/isAdmin gate lives in
// admin/(protected)/layout.tsx (specs/012). Joins tickets with business
// names in JS, not a new data-access function (research.md — pilot-scale,
// matching this project's own precedent of a page-level join rather than a
// display-only joined query, e.g. specs/013's business-name lookup).
export default async function SupportTicketsPage() {
  const [tickets, businesses] = await Promise.all([
    adminGetAllSupportTickets(),
    adminGetAllBusinesses(),
  ]);

  const businessNameById = new Map(businesses.map((b) => [b.id, b.name]));

  // Edge case (spec.md): a ticket referencing a business that no longer
  // exists is simply not listed — the inbox doesn't break.
  const rows: SupportInboxRow[] = tickets
    .filter((t) => businessNameById.has(t.businessId))
    .map((t) => ({
      id: t.id,
      subject: t.subject,
      businessName: businessNameById.get(t.businessId)!,
      status: t.status,
      createdAt: t.createdAt,
    }));

  const openCount = rows.filter((row) => row.status !== "resolved").length;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length === 0
            ? "No support tickets yet."
            : `${rows.length} ${rows.length === 1 ? "ticket" : "tickets"} · ${openCount} open`}
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <p className="px-6 py-10 text-center text-sm text-muted-foreground">
            No support tickets have been submitted yet.
          </p>
        </div>
      ) : (
        <SupportInbox tickets={rows} />
      )}
    </div>
  );
}
