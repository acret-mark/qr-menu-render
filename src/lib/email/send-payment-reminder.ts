import { sendMail } from "./google-smtp-client";
import { renderEmailHtml } from "./template";

export type SendPaymentReminderInput = {
  toEmail: string;
  businessName: string;
};

export type SendPaymentReminderResult = { ok: true } | { ok: false; reason: string };

/**
 * specs/029-email-notifications. Same shape as send-welcome-email.ts /
 * send-activation-confirmation.ts. Called only from the payment-reminder
 * cron route (src/app/api/cron/payment-reminders/route.ts) — never from a
 * "use client" file, since the SMTP credentials sendMail() reads must
 * never reach the browser bundle.
 *
 * Copy is a nudge only — no implication of a system-enforced deadline
 * (Constitution Principle II: no system-enforced trial-expiry logic here;
 * that's specs/020's own, separate territory).
 */
export async function sendPaymentReminder({
  toEmail,
  businessName,
}: SendPaymentReminderInput): Promise<SendPaymentReminderResult> {
  const html = renderEmailHtml({
    heading: "Payment still awaiting activation",
    paragraphs: [
      `Just a nudge — we haven't yet activated the subscription payment you submitted for <strong>${businessName}</strong>.`,
    ],
    highlight:
      "If you've already sent your proof of payment, no action is needed — an admin will review it shortly. If you haven't submitted proof yet, you can do so from your dashboard.",
    footer: "Thanks for your patience.",
  });

  return sendMail({
    to: toEmail,
    subject: `Your ${businessName} subscription payment is still awaiting activation`,
    text: [
      `Just a nudge — we haven't yet activated the subscription payment you submitted for ${businessName}.`,
      "",
      "If you've already sent your proof of payment, no action is needed — an admin will review it shortly.",
      "If you haven't submitted proof yet, you can do so from your dashboard.",
      "",
      "Thanks for your patience.",
    ].join("\n"),
    html,
  });
}
