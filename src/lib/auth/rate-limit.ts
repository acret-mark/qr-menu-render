import { headers } from "next/headers";

// Basic, reasonable-default protection against credential stuffing (spec
// 002 T033 — explicitly not a strict spec requirement, see spec.md
// Assumptions). In-memory, per-process: fine for a persistent Render Web
// Service (unlike a serverless deployment, this process stays warm), and
// deliberately simple rather than pulling in a Redis dependency for a
// pilot-scale product.

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, { count: number; windowStart: number }>();

async function getClientKey(action: string): Promise<string> {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headerList.get("x-real-ip") ??
    "unknown";
  return `${action}:${ip}`;
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Call before attempting an auth action. Does not itself record failure
 * vs. success — every call counts toward the window, which is intentional
 * (stops both a wrong-password-guessing loop and a registration-spam loop
 * equally, without needing to distinguish them).
 */
export async function checkRateLimit(
  action: "login" | "register" | "resend-confirmation"
): Promise<RateLimitResult> {
  const key = await getClientKey(action);
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}
