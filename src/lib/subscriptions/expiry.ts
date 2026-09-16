/**
 * Shared grace-period constant and T-7/T-1/T-0 threshold-boundary math for
 * specs/020-unified-subscription-lifecycle. Imported by both the expiry
 * cron (src/app/api/cron/subscription-expiry/route.ts) and the access gate
 * (./access-gate.ts) so the two can never disagree about when "locked"
 * begins. Ported near-verbatim from qr-menu-dev's
 * src/lib/subscription/expiry.ts (research.md Decision 1) — pure,
 * dependency-free date math, no behavior change.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Days past `expiresAt` before a subscription is locked (spec FR-005). */
export const GRACE_PERIOD_DAYS = 3;
export const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * ONE_DAY_MS;

export type ReminderThreshold = "t7" | "t1" | "t0";

const THRESHOLD_DAYS_BEFORE_EXPIRY: Record<ReminderThreshold, number> = {
  t7: 7,
  t1: 1,
  t0: 0,
};

// Ascending urgency — t0 (day of expiry) is the last, most urgent entry.
const THRESHOLD_ORDER: ReminderThreshold[] = ["t7", "t1", "t0"];

/** The moment a subscription's grace period (FR-005) elapses. */
export function graceDeadline(expiresAt: string | Date): Date {
  return new Date(new Date(expiresAt).getTime() + GRACE_PERIOD_MS);
}

/** True while `now` is still within the grace period after `expiresAt`. */
export function isWithinGrace(expiresAt: string | Date, now: Date = new Date()): boolean {
  return now.getTime() <= graceDeadline(expiresAt).getTime();
}

/** The moment a given threshold (T-7/T-1/T-0) is reached, relative to `expiresAt`. */
export function thresholdBoundary(expiresAt: string | Date, threshold: ReminderThreshold): Date {
  const daysBefore = THRESHOLD_DAYS_BEFORE_EXPIRY[threshold];
  return new Date(new Date(expiresAt).getTime() - daysBefore * ONE_DAY_MS);
}

/**
 * The most-urgent reminder threshold whose boundary has been reached as of
 * `now` but not yet recorded via `lastSentAt`
 * (subscriptions.expiryReminderSentAt — a single timestamp, not a
 * per-threshold label). Recording "when we last sent a reminder" as a plain
 * timestamp is enough to derive "which threshold(s) are already covered":
 * once `lastSentAt` is at or after a threshold's boundary, that threshold
 * (and every earlier, less urgent one) is considered already sent.
 *
 * Walks from T-0 backward so a subscription that skips straight past T-7 and
 * T-1 (e.g. created with `expiresAt` only a day out, or the cron missed a
 * run) gets exactly one email per run — the most urgent threshold currently
 * due — never a backlog of three (spec.md Edge Cases).
 *
 * Returns null when no new threshold has been crossed since `lastSentAt`.
 */
export function newlyCrossedThreshold(
  expiresAt: string | Date,
  lastSentAt: string | Date | null,
  now: Date = new Date()
): ReminderThreshold | null {
  const lastSentTime = lastSentAt ? new Date(lastSentAt).getTime() : null;

  for (let i = THRESHOLD_ORDER.length - 1; i >= 0; i--) {
    const threshold = THRESHOLD_ORDER[i];
    const boundary = thresholdBoundary(expiresAt, threshold).getTime();

    if (now.getTime() < boundary) {
      continue;
    }

    if (lastSentTime !== null && lastSentTime >= boundary) {
      // A reminder was already sent at or after this threshold's boundary —
      // this threshold (and every less-urgent one before it) is covered.
      return null;
    }

    return threshold;
  }

  return null;
}
