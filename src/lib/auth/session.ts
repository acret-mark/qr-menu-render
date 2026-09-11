import { auth } from "./auth.config";

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
};

/**
 * The single place every server component/action/route handler goes to find
 * out who's asking. Returns null for anyone without a valid, unexpired,
 * non-revoked session (FR-010 — no tenant-scoped action succeeds for a
 * signed-out caller). Never trust a client-supplied identity instead of
 * this.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    isAdmin: session.user.isAdmin,
  };
}

/**
 * Constitution Principle II: the admin check happens once, here, at the
 * boundary — every admin route/server action calls this before touching
 * admin-scoped data-access functions (contracts/data-access-layer.md).
 * Throws rather than returning a sentinel so a call site can't accidentally
 * ignore a false result and proceed anyway.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    throw new Error("Not authorized");
  }
  return user;
}

/**
 * Same fail-closed shape as requireAdmin, for owner-scoped actions that need
 * a signed-in identity but not admin status.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
