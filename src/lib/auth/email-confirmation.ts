"use server";

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { emailConfirmationTokens, users } from "@/lib/db/schema";
import { sendEmailConfirmation } from "@/lib/email/send-email-confirmation";
import { checkRateLimit } from "./rate-limit";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SENT_MESSAGE = "If that email needs confirming, we've sent a link.";
const RATE_LIMITED_MESSAGE = "Too many attempts — please wait a bit before trying again.";

export type RequestConfirmationResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Same anti-enumeration shape as requestPasswordResetAction (spec Edge
 * Cases) — always the same generic message, whether the email is
 * unregistered or already confirmed; only a real, unconfirmed account gets
 * an actual email. Rate-limited via this project's existing checkRateLimit
 * (spec FR-007a, research.md Decision 5) — the one real, distinguishable
 * failure mode this returns.
 */
export async function requestEmailConfirmation(email: string): Promise<RequestConfirmationResult> {
  const rateLimit = await checkRateLimit("resend-confirmation");
  if (!rateLimit.allowed) {
    return { ok: false, message: RATE_LIMITED_MESSAGE };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);

  if (user && !user.emailVerified) {
    const token = randomUUID();
    const expires = new Date(Date.now() + TOKEN_TTL_MS);
    await db.insert(emailConfirmationTokens).values({ token, userId: user.id, expires });

    const confirmUrl = `${SITE_URL}/confirm-email?token=${token}`;
    // Deliberately not awaited — see password-reset.ts's identical comment.
    // A slow/blocked outbound SMTP connection must never hang this action.
    sendEmailConfirmation({ toEmail: normalizedEmail, confirmUrl }).catch((err) => {
      console.error("Failed to send email confirmation", err);
    });
  }

  return { ok: true, message: SENT_MESSAGE };
}

export type ConfirmEmailResult =
  | { ok: true; email: string }
  // `email`, when present, lets the page offer a targeted resend for a
  // token that's expired but still identifiable — omitted when the row is
  // gone entirely (already used, or never existed), matching FR-009's
  // "no email in context" fallback (back to registration).
  | { ok: false; reason: "invalid" | "transient"; email?: string };

/**
 * Read-only classification check (spec FR-006/FR-006a) — does NOT consume
 * the token or set emailVerified. Real consumption happens exactly once,
 * inside auth.config.ts's authorize() confirmationToken branch, when the
 * caller actually attempts to sign in with this token (research.md
 * Decision 3/6). This function exists so the /confirm-email page can show
 * the right message (invalid vs. a genuine transient error) before
 * attempting that sign-in, and so a plainly dead link never even attempts
 * one.
 */
export async function confirmEmailAction(token: string): Promise<ConfirmEmailResult> {
  try {
    const [row] = await db
      .select()
      .from(emailConfirmationTokens)
      .where(eq(emailConfirmationTokens.token, token))
      .limit(1);

    if (!row) {
      return { ok: false, reason: "invalid" };
    }

    const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
    if (!user) {
      return { ok: false, reason: "invalid" };
    }

    if (row.expires.getTime() < Date.now()) {
      return { ok: false, reason: "invalid", email: user.email };
    }

    return { ok: true, email: user.email };
  } catch (err) {
    console.error("confirmEmailAction: lookup failed", err);
    return { ok: false, reason: "transient" };
  }
}
