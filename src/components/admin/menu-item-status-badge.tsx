import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// specs/018-business-detail's menu panel. Mirrors business-status-badge.tsx
// /ticket-status-badge.tsx's cva shape (specs/017/specs/021) — derived from
// an item's isSoldOut/isDisplayed pair (not its own db enum), same
// precedence business-menu-panel.tsx already used as plain text: sold out
// outranks hidden outranks visible.
export type MenuItemVisibility = "sold_out" | "hidden" | "visible";

const MENU_ITEM_STATUS_LABEL: Record<MenuItemVisibility, string> = {
  sold_out: "Sold Out",
  hidden: "Hidden",
  visible: "Visible",
};

const menuItemStatusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        sold_out: "bg-warning text-warning-foreground",
        hidden: "bg-muted text-muted-foreground",
        visible: "bg-success/15 text-success",
      } satisfies Record<MenuItemVisibility, string>,
    },
  }
);

interface MenuItemStatusBadgeProps extends VariantProps<typeof menuItemStatusBadgeVariants> {
  status: MenuItemVisibility;
  className?: string;
}

export function MenuItemStatusBadge({ status, className }: MenuItemStatusBadgeProps) {
  return (
    <span className={cn(menuItemStatusBadgeVariants({ status }), className)}>
      {MENU_ITEM_STATUS_LABEL[status]}
    </span>
  );
}
