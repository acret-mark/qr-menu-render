import { Fraunces, Bricolage_Grotesque } from "next/font/google";
import { REGISTER_HREF } from "@/lib/marketing/content";
import { POLICY_META, POLICY_SECTIONS } from "@/lib/marketing/privacy-content";
import "@/app/(marketing)/marketing.css";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { PrivacyToc } from "@/components/marketing/privacy-toc";
import { PrivacyContent } from "@/components/marketing/privacy-content";

export const metadata = { title: "Privacy Policy — Hapag" };

/**
 * Real Privacy Policy page (specs/031-privacy-policy) — replaces the
 * placeholder shipped by specs/030-marketing-homepage.
 *
 * Deliberately stays at this existing top-level route rather than moving
 * under the `(marketing)` route group (no URL change, no unnecessary
 * route-move churn — research.md Decision 3); instead it imports the same
 * marketing chrome and fonts that group's layout.tsx uses, so a visitor
 * arriving from the homepage footer's "Privacy Policy" link sees one
 * continuous visual experience (FR-003, FR-004).
 *
 * Deliberately does NOT apply the homepage's `mkt-reveal` scroll animation
 * (research.md Decision 4) — a visitor following a deep anchor link needs
 * the target section immediately visible, not faded in.
 */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function PrivacyPage() {
  return (
    <div className={`marketing-page ${fraunces.variable} ${bricolageGrotesque.variable}`}>
      <MarketingNav registerHref={REGISTER_HREF} />
      <main className="px-5 pt-16 min-[900px]:px-10">
        <PrivacyToc sections={POLICY_SECTIONS} />
        <PrivacyContent sections={POLICY_SECTIONS} meta={POLICY_META} />
      </main>
      <MarketingFooter />
    </div>
  );
}
