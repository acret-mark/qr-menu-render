"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut, UnconfirmedEmailError } from "./auth.config";
import { registerOwner, type RegisterOwnerInput } from "./register";
import { checkRateLimit } from "./rate-limit";
import { requestEmailConfirmation } from "./email-confirmation";

export type LoginActionResult = { ok: true } | { ok: false; message: string };

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const RATE_LIMITED_MESSAGE = "Too many attempts — please wait a bit before trying again.";
const UNCONFIRMED_EMAIL_MESSAGE = "Please confirm your email before signing in.";

/**
 * Server Action wrapping Auth.js v5's server-side `signIn` (auth.config.ts),
 * per Auth.js's documented Credentials + Server Action pattern. `signIn`
 * throws NEXT_REDIRECT on success (redirectTo below) — that error must
 * propagate, not be swallowed, or the redirect silently breaks. Any other
 * AuthError (invalid credentials) becomes a plain result for the form.
 */
export async function loginAction(email: string, password: string): Promise<LoginActionResult> {
  const rateLimit = await checkRateLimit("login");
  if (!rateLimit.allowed) {
    return { ok: false, message: RATE_LIMITED_MESSAGE };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
    return { ok: true };
  } catch (err) {
    if (err instanceof UnconfirmedEmailError) {
      // Deliberately NOT collapsed into the generic message below — this
      // only fires when the password was actually correct, so telling the
      // owner why login didn't proceed is not an enumeration risk the way
      // distinguishing "no such account" from "wrong password" would be
      // (specs/011-email-confirmation, matching qr-menu-dev's own
      // email_not_confirmed distinction).
      return { ok: false, message: UNCONFIRMED_EMAIL_MESSAGE };
    }
    if (err instanceof AuthError) {
      // Same message whether the account doesn't exist or the password is
      // wrong (SC-005 anti-enumeration) — auth.config.ts's authorize()
      // already collapses both cases before this point.
      return { ok: false, message: INVALID_CREDENTIALS_MESSAGE };
    }
    throw err;
  }
}

export type RegisterActionResult =
  | { ok: true }
  | { ok: false; stage: "duplicate-email" | "business" | "auth"; message: string };

/**
 * Registration now requires email confirmation before reaching the
 * dashboard (specs/011-email-confirmation), reversing specs/002's original
 * "not required for v1" decision — see specs/002/spec.md's Assumptions and
 * specs/011/spec.md's Clarifications for the recorded reversal. Sends a
 * confirmation email (requestEmailConfirmation) instead of signing the
 * owner in directly, then redirects to the confirmation-pending screen.
 */
export async function registerAction(input: RegisterOwnerInput): Promise<RegisterActionResult> {
  const rateLimit = await checkRateLimit("register");
  if (!rateLimit.allowed) {
    return { ok: false, stage: "auth", message: RATE_LIMITED_MESSAGE };
  }

  const result = await registerOwner(input);
  if (!result.ok) {
    return result;
  }

  await requestEmailConfirmation(input.email);
  redirect(`/confirm-email?email=${encodeURIComponent(input.email.trim().toLowerCase())}`);
}

export type CompleteEmailConfirmationResult = { ok: false; message: string };

const INVALID_CONFIRMATION_MESSAGE =
  "This confirmation link is invalid or has expired. Please request a new one.";

/**
 * Attempts to sign in using a confirmation token (specs/011 FR-004,
 * research.md Decision 3/6) — auth.config.ts's authorize() does the actual
 * validation/consumption; this wrapper only translates its outcome for the
 * /confirm-email page. Only ever returns on failure — success throws
 * NEXT_REDIRECT via `redirectTo`, exactly like registerAction/loginAction.
 */
export async function completeEmailConfirmation(
  token: string,
  email: string
): Promise<CompleteEmailConfirmationResult> {
  try {
    await signIn("credentials", {
      email,
      confirmationToken: token,
      redirectTo: "/business-profile",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: INVALID_CONFIRMATION_MESSAGE };
    }
    throw err;
  }

  // Unreachable — signIn always either redirects (throws) or throws
  // AuthError above — but satisfies the function's return type.
  return { ok: false, message: INVALID_CONFIRMATION_MESSAGE };
}

const INVALID_ADMIN_CREDENTIALS_MESSAGE = "Invalid email or password.";

/**
 * Separate from loginAction (T025 — /admin/login is its own route, per
 * qr-menu-dev's split admin/owner login). Passes loginContext: "admin" so
 * auth.config.ts's authorize() rejects non-admin accounts *before* a
 * session/cookie is ever created (FR-006/US3) — a non-admin account must
 * never reach the admin panel, even with a correct password. This must stay
 * a signIn()-level rejection rather than a post-signIn `redirect: false` +
 * getCurrentUser().isAdmin check + signOut(): that pattern re-reads auth()
 * in the same server action that just called signIn(), which Auth.js v5
 * doesn't guarantee reflects the session yet, and intermittently rejected
 * correct admin credentials.
 */
export async function adminLoginAction(
  email: string,
  password: string
): Promise<LoginActionResult> {
  const rateLimit = await checkRateLimit("login");
  if (!rateLimit.allowed) {
    return { ok: false, message: RATE_LIMITED_MESSAGE };
  }

  try {
    await signIn("credentials", { email, password, loginContext: "admin", redirectTo: "/admin" });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: INVALID_ADMIN_CREDENTIALS_MESSAGE };
    }
    throw err;
  }
}

/**
 * Signs the current owner out and returns them to /login (specs/009 FR-011).
 */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/**
 * Same as signOutAction, but for the admin shell (specs/012-payment-queue)
 * — returns to /admin/login rather than the owner /login.
 */
export async function signOutAdminAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/login" });
}
