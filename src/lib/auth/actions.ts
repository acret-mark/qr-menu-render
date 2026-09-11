"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn, signOut } from "./auth.config";
import { registerOwner, type RegisterOwnerInput } from "./register";
import { getCurrentUser } from "./session";
import { checkRateLimit } from "./rate-limit";

export type LoginActionResult = { ok: true } | { ok: false; message: string };

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const RATE_LIMITED_MESSAGE = "Too many attempts — please wait a bit before trying again.";

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

export async function registerAction(input: RegisterOwnerInput): Promise<RegisterActionResult> {
  const rateLimit = await checkRateLimit("register");
  if (!rateLimit.allowed) {
    return { ok: false, stage: "auth", message: RATE_LIMITED_MESSAGE };
  }

  const result = await registerOwner(input);
  if (!result.ok) {
    return result;
  }

  try {
    await signIn("credentials", {
      email: input.email,
      password: input.password,
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      // Account exists but the immediate sign-in failed for some reason —
      // fail safe rather than leaving the owner stranded on a blank error.
      return {
        ok: false,
        stage: "auth",
        message: "Your account was created. Please log in.",
      };
    }
    throw err;
  }

  return { ok: true };
}

const INVALID_ADMIN_CREDENTIALS_MESSAGE = "Invalid email or password.";

/**
 * Separate from loginAction (T025 — /admin/login is its own route, per
 * qr-menu-dev's split admin/owner login). Uses `redirect: false` rather
 * than `redirectTo` because it needs to check `isAdmin` *before* deciding
 * where to send the caller: a non-admin account must never reach the admin
 * panel, even with a correct password (FR-006/US3) — it's rejected here and
 * signed back out, not just redirected elsewhere while still signed in.
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
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, message: INVALID_ADMIN_CREDENTIALS_MESSAGE };
    }
    throw err;
  }

  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    await signOut({ redirect: false });
    return { ok: false, message: INVALID_ADMIN_CREDENTIALS_MESSAGE };
  }

  redirect("/admin");
}
