"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Tag, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

type NavSection = "dashboard" | "menu" | "categories" | "qr";

const SECTIONS: {
  section: NavSection;
  label: string;
  href: string;
  icon: typeof Home;
}[] = [
  { section: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { section: "menu", label: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
  { section: "categories", label: "Categories", href: "/categories", icon: Tag },
  { section: "qr", label: "QR", href: "/qr", icon: QrCode },
];

// "/dashboard" needs an exact match so it doesn't also light up for
// "/dashboard/menu" — every other section matches by prefix so its own
// sub-routes (e.g. /dashboard/menu/new, /dashboard/menu/[id]/edit) keep the
// right tab active (spec FR-006, data-model.md).
function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function OwnerTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Owner navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background"
    >
      <ul className="mx-auto flex max-w-2xl">
        {SECTIONS.map(({ section, label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={section} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-xs",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
