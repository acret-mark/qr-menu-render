import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

// specs/033-search-engine-indexing-control FR-009.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * specs/015-trial-expired-suspended. Standalone route, outside the
 * (owner) route group (research.md Decision 1) — never inherits
 * OwnerHeader/OwnerTabBar, so no dashboard navigation is reachable from
 * here (FR-002). Independently re-verifies session + business status
 * (research.md Decision 2, FR-009) rather than trusting the (owner)
 * layout's redirect — a bookmarked or reactivated-mid-session visit gets
 * the correct outcome either way.
 */
export default async function AccountSuspendedPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOwnBusiness(user.id);
  if (business?.status !== "suspended") {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-xl font-semibold">Your account is on hold</h1>
      <p className="text-sm text-muted-foreground">
        Reactivating keeps your menu live and editable — nothing is lost while it&apos;s on hold.
      </p>

      <div className="mt-4 flex w-full flex-col gap-2">
        <Link
          href="/business-profile#subscription"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Reactivate Subscription
        </Link>
        <Link
          href="/business-profile#support"
          className="flex h-11 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Contact Support
        </Link>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="h-11 w-full">
            Log out
          </Button>
        </form>
      </div>
    </div>
  );
}
