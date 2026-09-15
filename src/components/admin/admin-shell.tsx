"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, CreditCard, LifeBuoy, type LucideIcon } from "lucide-react";
import { signOutAdminAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Admin shell (specs/012-payment-queue) — this project's admin equivalent
// of specs/009's owner (owner) layout/OwnerTabBar. No search box (out of
// this feature's scope, unlike qr-menu-dev's later-evolved shipped shell —
// research.md Decision 1 targets qr-menu-dev's original trigger point, not
// its fully-evolved state).
type NavItem =
  | { label: string; icon: LucideIcon; enabled: true; href: string; section: string }
  | { label: string; icon: LucideIcon; enabled: false };

const NAV_ITEMS: NavItem[] = [
  { label: "Businesses", icon: Store, enabled: true, href: "/admin", section: "/admin" },
  {
    label: "Payments",
    icon: CreditCard,
    enabled: true,
    href: "/admin/payments",
    section: "/admin/payments",
  },
  // Disabled until specs' future support-ticket-management admin spec
  // builds the destination (research.md Decision 2).
  { label: "Support", icon: LifeBuoy, enabled: false },
];

function isActive(pathname: string, item: Extract<NavItem, { enabled: true }>): boolean {
  if (item.href === "/admin") {
    // Exact match only — otherwise "/admin" as a prefix would also light up
    // for "/admin/payments" (mirrors specs/009's OwnerTabBar dashboard rule).
    return pathname === "/admin";
  }
  return pathname === item.href || pathname.startsWith(`${item.section}/`);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border">
        <div className="px-4 py-4 text-sm font-semibold">Hapag Admin</div>
        <nav className="flex-1 px-2 py-2">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;

              if (!item.enabled) {
                return (
                  <li key={item.label}>
                    <span
                      aria-disabled="true"
                      className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/50"
                    >
                      <Icon className="size-4.5" />
                      {item.label}
                    </span>
                  </li>
                );
              }

              const active = isActive(pathname, item);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted",
                      active && "bg-muted font-medium"
                    )}
                  >
                    <Icon className="size-4.5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end border-b border-border px-6">
          <form action={signOutAdminAction}>
            <Button type="submit" variant="outline" size="sm">
              Log out
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
