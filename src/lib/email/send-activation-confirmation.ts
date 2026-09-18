import { sendMail } from "./google-smtp-client";
import { renderEmailHtml } from "./template";

export type SendActivationConfirmationInput = {
  toEmail: string;
  businessName: string;
  plan: string;
};

export type SendActivationConfirmationResult = { ok: true } | { ok: false; reason: string };

/**
 * Mirrors send-welcome-email.ts/send-password-reset.ts exactly
 * (specs/013-activate-subscription, research.md Decision 4) — same
 * sendMail transport, an activation-specific subject/body.
 */
export async function sendActivationConfirmationEmail({
  toEmail,
  businessName,
  plan,
}: SendActivationConfirmationInput): Promise<SendActivationConfirmationResult> {
  const html = renderEmailHtml({
    heading: `${businessName} is live!`,
    paragraphs: [
      `Great news — your ${plan} subscription has been activated and <strong>${businessName}</strong> is now live on Hapag.`,
      "Customers can now scan your QR code and view your menu.",
    ],
  });

  return sendMail({
    to: toEmail,
    subject: `${businessName} is live on Hapag!`,
    text: [
      `Great news — your ${plan} subscription has been activated and ${businessName} is now live on Hapag.`,
      "",
      "Customers can now scan your QR code and view your menu.",
      "",
      "Thanks for choosing Hapag.",
    ].join("\n"),
    html,
  });
}
