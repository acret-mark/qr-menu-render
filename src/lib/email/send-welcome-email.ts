import { sendMail } from "./google-smtp-client";
import { renderEmailHtml } from "./template";

export type SendWelcomeEmailInput = {
  toEmail: string;
  businessName: string;
};

export type SendWelcomeEmailResult = { ok: true } | { ok: false; reason: string };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Ported from qr-menu-dev/src/lib/email/send-welcome-email.ts (Constitution
 * Principle VI). Only change: the login link is unconditional since this
 * project's registration flow (src/lib/auth/register.ts) never defers
 * account creation behind an email-confirmation step the way qr-menu-dev's
 * did — there's no "no session yet" branch to account for here.
 */
export async function sendWelcomeEmail({
  toEmail,
  businessName,
}: SendWelcomeEmailInput): Promise<SendWelcomeEmailResult> {
  const loginUrl = `${SITE_URL}/login`;

  const html = renderEmailHtml({
    heading: `Welcome, ${businessName}!`,
    paragraphs: [`Welcome aboard — ${businessName} is now set up on Hapag.`],
    highlight:
      "Next step: build your menu by adding categories and items, then generate your QR code so customers can start ordering.",
    cta: { label: "Log in to get started", url: loginUrl },
  });

  return sendMail({
    to: toEmail,
    subject: `Welcome to Hapag, ${businessName}!`,
    text: [
      `Welcome aboard — ${businessName} is now set up on Hapag.`,
      "",
      "Next step: build your menu by adding categories and items, then generate your QR code so customers can start ordering.",
      "",
      `Log in here to get started: ${loginUrl}`,
      "",
      "Thanks for choosing Hapag.",
    ].join("\n"),
    html,
  });
}
