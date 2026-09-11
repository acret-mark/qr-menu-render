"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { setPassword } from "./password";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SENT_MESSAGE = "If that email is registered, we've sent a link to reset your password.";

export type RequestResetResult = { ok: true; message: string };

/**
 * Always returns the same success message regardless of whether the email
 * exists (matches qr-menu-dev's forgot-password behavior and SC-005's
 * anti-enumeration requirement) — the only observable difference is whether
 * an email actually goes out, which an outside observer can't see.
 */
export async function requestPasswordResetAction(email: string): Promise<RequestResetResult> {
  const normalizedEmail = email.trim().toLowerCase();

  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (user) {
    const token = randomUUID();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);
    await db.insert(passwordResetTokens).values({ token, userId: user.id, expires });

    const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ toEmail: normalizedEmail, resetUrl }).catch((err) => {
      console.error("Failed to send password reset email", err);
    });
  }

  return { ok: true, message: SENT_MESSAGE };
}

export type ResetPasswordResult = { ok: true } | { ok: false; message: string };

const INVALID_TOKEN_MESSAGE = "This reset link is invalid or has expired. Please request a new one.";

/**
 * Consumes the token (deletes it) on success so it can't be replayed.
 * Delegates the actual password update + session revocation to
 * password.ts's setPassword, which is also FR-004a's enforcement point.
 */
export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!row || row.expires.getTime() < Date.now()) {
    return { ok: false, message: INVALID_TOKEN_MESSAGE };
  }

  await setPassword(row.userId, newPassword);
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  return { ok: true };
}
