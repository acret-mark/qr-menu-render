import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Shared shell for every admin screen (specs/012-payment-queue) — the
 * admin equivalent of specs/009's (owner) layout. Consolidates the inline
 * `isAdmin` check the business-list page used to duplicate on its own
 * (FR-010/Clarifications). Route group only — every URL under it is
 * unchanged.
 */
export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    redirect("/admin/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
