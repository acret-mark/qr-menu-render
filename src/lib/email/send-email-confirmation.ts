import { sendMail } from "./google-smtp-client";

export type SendEmailConfirmationInput = {
  toEmail: string;
  confirmUrl: string;
};

export type SendEmailConfirmationResult = { ok: true } | { ok: false; reason: string };

/**
 * Mirrors send-password-reset.ts exactly (specs/011-email-confirmation) —
 * same Gmail-SMTP send path, a confirmation-specific subject/body.
 */
export async function sendEmailConfirmation({
  toEmail,
  confirmUrl,
}: SendEmailConfirmationInput): Promise<SendEmailConfirmationResult> {
  return sendMail({
    to: toEmail,
    subject: "Confirm your Hapag account",
    text: [
      "Thanks for registering with Hapag — one more step before you're set up.",
      "",
      `Confirm your account here: ${confirmUrl}`,
      "",
      "This link expires in 1 hour. If you didn't create this account, you can ignore this email.",
    ].join("\n"),
  });
}
