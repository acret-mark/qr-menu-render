"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TicketStatusBadge } from "@/components/admin/ticket-status-badge";
import { formatAdminDate } from "@/lib/admin/format";
import type { SupportTicket } from "@/lib/data-access/support-tickets";
import { cn } from "@/lib/utils";

export type SupportInboxRow = {
  id: string;
  subject: string;
  businessName: string;
  status: SupportTicket["status"];
  createdAt: Date;
};

const STATUS_FILTER_OPTIONS: { value: SupportTicket["status"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const FIELD_CLASSNAME =
  "h-9 rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

// specs/021-support-ticket-management FR-002/FR-003, research.md Decision
// 3 — filter/sort are client-side over one already-fetched list, no new
// query per change (matching this project's pilot-scale, no-pagination
// convention). Rows link out to a real per-ticket detail route
// (research.md Decision — this project's own established row-navigation
// pattern, specs/012/017/018), not an in-page master-detail split.
export function SupportInbox({ tickets }: { tickets: SupportInboxRow[] }) {
  const [statusFilter, setStatusFilter] = useState<SupportTicket["status"] | "all">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const visibleTickets = useMemo(() => {
    const filtered =
      statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter);
    const sorted = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return sortOrder === "newest" ? sorted : sorted.reverse();
  }, [tickets, statusFilter, sortOrder]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SupportTicket["status"] | "all")}
          className={FIELD_CLASSNAME}
        >
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className={FIELD_CLASSNAME}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {visibleTickets.length === 0 ? (
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">
          No tickets match this filter.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Business</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {visibleTickets.map((ticket) => {
              const href = `/admin/support/${ticket.id}`;
              return (
                <tr
                  key={ticket.id}
                  className={cn("border-b border-border last:border-none hover:bg-muted")}
                >
                  <td className="p-0">
                    <Link href={href} className="block px-5 py-3.5 font-medium">
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={href} className="block px-5 py-3.5">
                      {ticket.businessName}
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={href} className="block px-5 py-3.5">
                      <TicketStatusBadge status={ticket.status} />
                    </Link>
                  </td>
                  <td className="p-0">
                    <Link href={href} className="block px-5 py-3.5">
                      {formatAdminDate(ticket.createdAt)}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
