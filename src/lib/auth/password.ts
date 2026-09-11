import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { sessions, users } from "@/lib/db/schema";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Returns false (never throws) for a null/unusable hash — the state a
 * clean-break-recreated account (FR-008) is in before it completes a
 * password reset. Callers route that case to the reset flow (FR-009)
 * rather than treating it as an error.
 */
export async function verifyPassword(
  password: string,
  hash: string | null
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/**
 * FR-004a: completing a password reset/change invalidates every other
 * active session for the account — a session established with the old
 * password must not remain usable. Deletes ALL session rows for the user,
 * including the one making this request; the caller is expected to
 * establish a fresh session immediately after (e.g. by redirecting to
 * /login), not to assume the current request's session survives.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function setPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  await revokeAllSessions(userId);
}
