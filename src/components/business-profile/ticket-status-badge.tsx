import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { SupportTicket } from "@/lib/data-access/support-tickets";

// specs/022-owner-support-tab. A separate instance from
// components/admin/ticket-status-badge.tsx (specs/021) — this project's
// established convention of not sharing components across the owner/admin
// surface boundary even when visually similar (e.g. specs/018's
// BusinessDetailTabs vs specs/014's AccountTabs).
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
