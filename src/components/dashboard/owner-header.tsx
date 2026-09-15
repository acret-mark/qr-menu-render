import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// Minimal shell header (spec FR-011, research.md Decision 4) — a brand
// label and a logout control, the first UI in this codebase that reaches
// the existing signOutAction. No business-profile avatar link (out of
// scope — spec Assumptions; that destination doesn't exist yet).
export function OwnerHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <span className="font-semibold">Hapag</span>
      <form action={signOutAction}>
        <Button type="submit" variant="outline" size="sm">
          Log out
        </Button>
      </form>
    </header>
  );
}
