// Shared HTML shell for every outbound email, styled as a Supabase-Auth-style
// card (logo wordmark, heading, body, single CTA button, footer) but using
// Hapag's own brand tokens (qr-menu-dev/design-reference/src/styles/tokens.css)
// instead of Supabase's palette. Inlined hex values, not CSS custom
// properties — email clients don't reliably support `var()`.
const COLOR = {
  primary: "#f47b43",
  primaryForeground: "#ffffff",
  foreground: "#1b1b18",
  mutedForeground: "#6b6862",
  muted: "#f1f1f1",
  border: "#e2e2e2",
  card: "#ffffff",
  destructive: "#b3261e",
  destructiveBg: "#fdecea",
};

export type EmailTemplateInput = {
  heading: string;
  /** Body paragraphs, in order. May contain inline HTML (e.g. <strong>). */
  paragraphs: string[];
  /** Callout box for a "next step"-style instruction. */
  highlight?: string;
  /** Red callout box for time-sensitive warnings. */
  urgent?: string;
  cta?: { label: string; url: string };
  footer?: string;
};

export function renderEmailHtml({
  heading,
  paragraphs,
  highlight,
  urgent,
  cta,
  footer = "Thanks for choosing Hapag.",
}: EmailTemplateInput): string {
  return `
<div style="background:${COLOR.muted};padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:14px;overflow:hidden">
    <div style="padding:28px 32px 0">
      <span style="font-family:Georgia,'Playfair Display',serif;font-weight:700;font-size:20px;color:${COLOR.primary}">Hapag</span>
    </div>
    <div style="padding:20px 32px 32px">
      <h2 style="margin:0 0 16px;font-family:Georgia,'Playfair Display',serif;font-weight:600;font-size:20px;color:${COLOR.foreground}">${heading}</h2>
      ${paragraphs
        .map(
          (p) =>
            `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${COLOR.foreground}">${p}</p>`
        )
        .join("")}
      ${
        cta
          ? `<a href="${cta.url}" style="display:inline-block;margin:0 0 16px;padding:12px 24px;background:${COLOR.primary};color:${COLOR.primaryForeground};font-weight:600;font-size:14px;border-radius:8px;text-decoration:none">${cta.label}</a>`
          : ""
      }
      ${
        highlight
          ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;padding:14px 16px;background:${COLOR.muted};border-radius:8px;color:${COLOR.foreground}">${highlight}</p>`
          : ""
      }
      ${
        urgent
          ? `<p style="margin:0;font-size:13px;line-height:1.6;padding:12px 16px;background:${COLOR.destructiveBg};border-left:3px solid ${COLOR.destructive};border-radius:4px;color:${COLOR.foreground}">${urgent}</p>`
          : ""
      }
    </div>
    <div style="padding:16px 32px;border-top:1px solid ${COLOR.border};background:${COLOR.muted}">
      <p style="margin:0;font-size:12px;color:${COLOR.mutedForeground}">${footer}</p>
    </div>
  </div>
</div>`.trim();
}
