import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { OwnerHeader } from "@/components/dashboard/owner-header";
import { OwnerTabBar } from "@/components/dashboard/owner-tab-bar";

/**
 * Shared shell for every owner screen (specs/009-owner-dashboard-shell).
 * Consolidates the inline getCurrentUser()/redirect check each of
 * dashboard/categories/menu/qr used to duplicate on its own (FR-012) —
 * business-existence handling stays page-specific (research.md Decision 3),
 * since this project has no generic error-state screen yet (029's
 * territory). Route group only — every URL under it is unchanged.
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

  return (
    <div className="flex min-h-dvh flex-col">
      <OwnerHeader />
      <main className="flex-1 pb-20">{children}</main>
      <OwnerTabBar />
    </div>
  );
}
