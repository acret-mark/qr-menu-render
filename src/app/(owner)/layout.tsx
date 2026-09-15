import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { OwnerHeader } from "@/components/dashboard/owner-header";
import { OwnerTabBar } from "@/components/dashboard/owner-tab-bar";

/**
 * Shared shell for every owner screen (specs/009-owner-dashboard-shell).
 * Consolidates the inline getCurrentUser()/redirect check each of
 * dashboard/categories/menu/qr used to duplicate on its own (FR-012) —
 * business-existence handling stays page-specific (research.md Decision 3),
 * since this project has no generic error-state screen yet (029's
 * territory). Route group only — every URL under it is unchanged.
 *
 * specs/015-trial-expired-suspended: also gates on business status, the
 * first check this layout performs beyond session. A missing business row
 * is deliberately NOT specially handled here (business?.status simply
 * won't equal "suspended") — that stays specs/009's Decision 3 assignment
 * to a future error-state spec, unchanged by this feature.
 */
export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const business = await getOwnBusiness(user.id);
  if (business?.status === "suspended") {
    redirect("/account-suspended");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <OwnerHeader />
      <main className="flex-1 pb-20">{children}</main>
      <OwnerTabBar />
    </div>
  );
}
