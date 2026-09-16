import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/lib/data-access/support-tickets";

// specs/021-support-ticket-management. Mirrors business-status-badge.tsx's
// cva shape (specs/017) — open needs attention (warning tone), in_progress
// is neutral (being worked), resolved is done (success tone).
const ticketStatusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        open: "bg-warning text-warning-foreground",
        in_progress: "bg-muted text-muted-foreground",
        resolved: "bg-success/15 text-success",
      } satisfies Record<SupportTicket["status"], string>,
    },
  }
);

const STATUS_LABEL: Record<SupportTicket["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

interface TicketStatusBadgeProps extends VariantProps<typeof ticketStatusBadgeVariants> {
  status: SupportTicket["status"];
  className?: string;
}

export function TicketStatusBadge({ status, className }: TicketStatusBadgeProps) {
  return (
    <span className={cn(ticketStatusBadgeVariants({ status }), className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
