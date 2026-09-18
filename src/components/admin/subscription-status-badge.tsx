import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { Subscription } from "@/lib/data-access/subscriptions";

// specs/018-business-detail's subscription-history table. Mirrors
// business-status-badge.tsx's cva shape (specs/017) — active is settled
// (success tone), pending still needs review (warning), expired is a
// closed-out past record (neutral), cancelled is a rejected/void record
// (destructive).
const subscriptionStatusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        active: "bg-success/15 text-success",
        pending: "bg-warning text-warning-foreground",
        expired: "bg-muted text-muted-foreground",
        cancelled: "bg-destructive/15 text-destructive",
      } satisfies Record<Subscription["status"], string>,
    },
  }
);

interface SubscriptionStatusBadgeProps extends VariantProps<typeof subscriptionStatusBadgeVariants> {
  status: Subscription["status"];
  className?: string;
}

export function SubscriptionStatusBadge({ status, className }: SubscriptionStatusBadgeProps) {
  return <span className={cn(subscriptionStatusBadgeVariants({ status }), className)}>{status}</span>;
}
