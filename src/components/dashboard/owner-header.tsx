import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";

// Mirrors admin-shell.tsx's "AC" avatar (first letter of up to the first two
// words), but derived from the business name instead of hardcoded, since the
// owner side has no fixed staff roster to hardcode initials for.
function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return initials.toUpperCase() || "?";
}

// Minimal shell header (specs/009 FR-011, research.md Decision 4) — a
// brand mark, a profile-avatar link (specs/010 FR-012 — closes the loop
// specs/009's own Assumptions left open), and a logout control, the first
// UI in this codebase that reaches the existing signOutAction.
export function OwnerHeader({ businessName }: { businessName: string }) {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <Link href="/dashboard">
        <Image src="/brand.png" alt="Hapag" width={530} height={154} className="h-6 w-auto shrink-0" />
      </Link>
      <div className="flex items-center gap-2">
        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut size={14} />
            Log out
          </button>
        </form>
        <Link
          href="/business-profile"
          aria-label="Business profile"
          title={businessName}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {getInitials(businessName)}
        </Link>
      </div>
    </header>
  );
}
