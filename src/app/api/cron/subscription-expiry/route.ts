import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businesses, subscriptions, users } from "@/lib/db/schema";
import { isWithinGrace, newlyCrossedThreshold } from "@/lib/subscriptions/expiry";
import { sendSubscriptionReminder } from "@/lib/email/send-subscription-reminder";

/**
 * Daily cron per specs/020-unified-subscription-lifecycle (research.md
 * Decision 2) — the route render.yaml already declares a cron job's target
 * for, never previously built. CRON_SECRET-gated, mirrors
 * src/app/api/health/route.ts's sibling shape: never rendered, never
 * reachable as a page.
 *
 * Deviation recorded once in this feature's Amendment (Clarifications):
 * this route NEVER writes `businesses.status` — the locked state is a live
 * computation (src/lib/subscriptions/access-gate.ts) from the
 * subscription's own `expiresAt`/grace, not a stored business-level value.
 * This route only ever transitions `subscriptions.status` to `expired`.
 */

type DueSubscription = {
  id: string;
  businessId: string;
  plan: string;
  status: string;
  expiresAt: Date;
  expiryReminderSentAt: Date | null;
};

/**
 * Optimistic-concurrency claim (research.md Decision 2): the update only
 * takes effect if expiryReminderSentAt still matches the value read here,
 * so two overlapping cron runs can't both claim (and thus both email) the
 * same threshold for the same subscription.
 */
async function claimReminderSlot(subscription: DueSubscription, now: Date): Promise<boolean> {
  const matchCondition = subscription.expiryReminderSentAt
    ? eq(subscriptions.expiryReminderSentAt, subscription.expiryReminderSentAt)
    : isNull(subscriptions.expiryReminderSentAt);

  const claimed = await db
    .update(subscriptions)
    .set({ expiryReminderSentAt: now })
    .where(and(eq(subscriptions.id, subscription.id), matchCondition))
    .returning({ id: subscriptions.id });

  return claimed.length > 0;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();

  const dueSubscriptions = await db
    .select({
      id: subscriptions.id,
      businessId: subscriptions.businessId,
      plan: subscriptions.plan,
      status: subscriptions.status,
      expiresAt: subscriptions.expiresAt,
      expiryReminderSentAt: subscriptions.expiryReminderSentAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.status, "active"));

  let reminded = 0;
  let expired = 0;
  let failed = 0;

  for (const subscription of dueSubscriptions) {
    if (!subscription.expiresAt) continue;
    const due = subscription as DueSubscription;

    // --- Reminder thresholds (FR-008/FR-009/FR-010) ---
    const threshold = newlyCrossedThreshold(due.expiresAt, due.expiryReminderSentAt, now);

    if (threshold) {
      const claimed = await claimReminderSlot(due, now);

      if (claimed) {
        const [business] = await db
          .select({ name: businesses.name, ownerId: businesses.ownerId })
          .from(businesses)
          .where(eq(businesses.id, due.businessId))
          .limit(1);

        if (!business) {
          console.error("Subscription expiry cron: could not resolve business", due.businessId);
          failed++;
        } else {
          const [owner] = await db
            .select({ email: users.email })
            .from(users)
            .where(eq(users.id, business.ownerId))
            .limit(1);

          if (!owner) {
            console.error("Subscription expiry cron: could not resolve owner email", business.ownerId);
            failed++;
          } else {
            const result = await sendSubscriptionReminder({
              toEmail: owner.email,
              businessName: business.name,
              isTrial: due.plan === "trial",
              threshold,
            });

            if (result.ok) {
              reminded++;
            } else {
              console.error("Subscription expiry cron: reminder send failed", due.id, result.reason);
              failed++;
            }
          }
        }
      }
    }

    // --- Grace-period lockout transition (FR-005/FR-007) ---
    if (!isWithinGrace(due.expiresAt, now)) {
      const lockedRows = await db
        .update(subscriptions)
        .set({ status: "expired" })
        .where(and(eq(subscriptions.id, due.id), eq(subscriptions.status, "active")))
        .returning({ id: subscriptions.id });

      if (lockedRows.length > 0) {
        expired++;
      }
    }
  }

  return Response.json({ reminded, expired, failed });
}
