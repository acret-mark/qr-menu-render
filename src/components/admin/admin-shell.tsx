"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Store, CreditCard, LifeBuoy, Search, type LucideIcon } from "lucide-react";
import { signOutAdminAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Admin shell (specs/012-payment-queue) — this project's admin equivalent
// of specs/009's owner (owner) layout/OwnerTabBar. Ported qr-menu-dev's
// later-evolved search box (qr-menu-dev/src/components/admin/
// admin-shell.tsx) — a prior comment here marked it deliberately out of
// scope; that's now superseded.
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
  // Enabled by specs/021-support-ticket-management, which builds the
  // destination this entry previously had no route for.
  {
    label: "Support",
    icon: LifeBuoy,
    enabled: true,
    href: "/admin/support",
    section: "/admin/support",
  },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);
  // Keeps the box in sync when the URL's own `q` changes from elsewhere
  // (e.g. navigating to /admin without one) rather than from typing here —
  // React's own recommended "adjust state during render" pattern
  // (react.dev), not a setState-in-effect, which this project's lint
  // config (correctly) disallows as a cascading-render anti-pattern.
  // Ported from qr-menu-dev's admin-shell.tsx.
  const [trackedUrlQuery, setTrackedUrlQuery] = useState(urlQuery);
  if (urlQuery !== trackedUrlQuery) {
    setTrackedUrlQuery(urlQuery);
    setQuery(urlQuery);
  }

  // Debounced push, not every keystroke — this always resolves to the
  // business list (the only page this query currently filters), regardless
  // of which admin page the search box is used from, since "Search
  // businesses…" is what it's always labeled. Skips the push entirely once
  // the URL already matches, so this doesn't fight the sync effect above
  // into a loop.
  useEffect(() => {
    const id = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      if (query === current) return;
      const params = new URLSearchParams(searchParams);
      if (query.trim()) {
        params.set("q", query);
      } else {
        params.delete("q");
      }
      const target = params.toString() ? `/admin?${params.toString()}` : "/admin";
      router.push(target);
    }, 300);
    return () => clearTimeout(id);
  }, [query, router, searchParams]);

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border">
        <div className="flex items-center gap-2 px-4 py-4">
          <Image src="/brand.png" alt="Hapag" width={530} height={154} className="h-6 w-auto shrink-0" />
          <span className="text-sm font-semibold">Admin</span>
        </div>
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
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6">
          <div className="flex max-w-xs flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search businesses…"
              className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex-1" />
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
