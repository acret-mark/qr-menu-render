import Link from "next/link";
import { User } from "lucide-react";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Minimal shell header (specs/009 FR-011, research.md Decision 4) — a
// brand label, a profile-avatar link (specs/010 FR-012 — closes the loop
// specs/009's own Assumptions left open), and a logout control, the first
// UI in this codebase that reaches the existing signOutAction.
export function OwnerHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <span className="font-semibold">Hapag</span>
      <div className="flex items-center gap-2">
        <Link
          href="/business-profile"
          aria-label="Business profile"
          className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
        >
          <User className="size-4" />
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>
    </header>
  );
}
