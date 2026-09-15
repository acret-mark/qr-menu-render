import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businesses, users } from "@/lib/db/schema";
import { claimDuePaymentReminders } from "@/lib/data-access/subscriptions";
import { sendPaymentReminder } from "@/lib/email/send-payment-reminder";

// specs/029-email-notifications FR-004–FR-006/FR-012. Daily cron — the
// route render.yaml already declares a cron job's target for, never
// previously built. CRON_SECRET-gated, mirrors src/app/api/health/
// route.ts's and specs/020's subscription-expiry route's identical
// sibling shape: never rendered, never reachable as a page. Deliberately
// separate from that route (spec Clarifications, research.md) — this one
// governs the unrelated pending-payment nudge via
// subscriptions.reminderSentAt, not the expiry-lockout lifecycle.
const DEFAULT_THRESHOLD_DAYS = 3;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const thresholdDays =
    Number(process.env.PAYMENT_REMINDER_THRESHOLD_DAYS) || DEFAULT_THRESHOLD_DAYS;

  const candidates = await claimDuePaymentReminders(thresholdDays);

  let sent = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const [business] = await db
      .select({ name: businesses.name, ownerId: businesses.ownerId })
      .from(businesses)
      .where(eq(businesses.id, candidate.businessId))
      .limit(1);

    if (!business) {
      console.error("Payment reminder: could not resolve business", candidate.businessId);
      failed++;
      continue;
    }

    const [owner] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, business.ownerId))
      .limit(1);

    if (!owner) {
      console.error("Payment reminder: could not resolve owner email", business.ownerId);
      failed++;
      continue;
    }

    const result = await sendPaymentReminder({ toEmail: owner.email, businessName: business.name });

    if (result.ok) {
      sent++;
    } else {
      console.error("Payment reminder send failed", candidate.subscriptionId, result.reason);
      failed++;
    }
  }

  return Response.json({ claimed: candidates.length, sent, failed });
}
