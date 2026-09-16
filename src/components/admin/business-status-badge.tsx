import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Business } from "@/lib/data-access/businesses";

// specs/017-business-list FR-003, research.md Decision 2 — four-color
// mapping confirmed against the actual status enum (pending/trial/active/
// suspended, specs/002's schema). Mirrors qr-menu-dev's own StatusBadge.
const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        active: "bg-success/15 text-success",
        trial: "bg-warning text-warning-foreground",
        pending: "bg-muted text-muted-foreground",
        suspended: "bg-destructive/15 text-destructive",
      } satisfies Record<Business["status"], string>,
    },
  }
);

interface BusinessStatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: Business["status"];
  className?: string;
}

export function BusinessStatusBadge({ status, className }: BusinessStatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ status }), className)}>{status}</span>;
}
