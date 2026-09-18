import { TicketStatusBadge } from "@/components/business-profile/ticket-status-badge";
import { formatAdminDate } from "@/lib/admin/format";
import type { SupportTicket } from "@/lib/data-access/support-tickets";

// specs/022-owner-support-tab FR-010, research.md Decision 1. Used for any
// ticket with no reply on file, regardless of status label (open OR
// in_progress) — grouped by reply presence, not status. A distinct
// component from TicketResolved, never a shared conditional layout
// (FR-011).
export function TicketAwaitingResponse({
  ticket,
  onBack,
}: {
  ticket: SupportTicket;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to tickets
      </button>

      <div className="flex items-start justify-between gap-3">
        <h2 className="flex-1 text-lg font-semibold">{ticket.subject}</h2>
        <TicketStatusBadge status={ticket.status} />
      </div>
      <div className="-mt-2 text-sm text-muted-foreground">
        Submitted {formatAdminDate(ticket.createdAt)}
      </div>

      <div className="border-t border-border pt-4">
        <div className="text-sm font-medium text-muted-foreground">Your message</div>
        <p className="mt-1.5 text-sm whitespace-pre-wrap">{ticket.message}</p>

        <div className="mt-4 border-t border-dashed border-border pt-4">
          <div className="text-sm font-medium text-muted-foreground">ACRET Support</div>
          <p className="mt-1.5 text-sm text-muted-foreground italic">Awaiting response</p>
        </div>
      </div>
    </div>
  );
}
