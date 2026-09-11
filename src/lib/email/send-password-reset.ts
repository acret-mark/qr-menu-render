import { sendMail } from "./google-smtp-client";

export type SendPasswordResetEmailInput = {
  toEmail: string;
  resetUrl: string;
};

export type SendPasswordResetEmailResult = { ok: true } | { ok: false; reason: string };

/**
 * New for this project (spec 002 FR-004) — qr-menu-dev's equivalent was
 * Supabase Auth's built-in `resetPasswordForEmail`, which has no direct
 * analog here. Shares the same Gmail-SMTP send path as
 * send-welcome-email.ts (Constitution Principle VI's "unchanged
 * dependencies" applies to the transport, not to this specific message).
 */
export async function sendPasswordResetEmail({
  toEmail,
  resetUrl,
}: SendPasswordResetEmailInput): Promise<SendPasswordResetEmailResult> {
  return sendMail({
    to: toEmail,
    subject: "Reset your Hapag password",
    text: [
      "We received a request to reset your Hapag password.",
      "",
      `Reset it here: ${resetUrl}`,
      "",
      "This link expires in 1 hour. If you didn't request this, you can ignore this email.",
    ].join("\n"),
  });
}
