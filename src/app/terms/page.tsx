import { Fraunces, Bricolage_Grotesque } from "next/font/google";
import { REGISTER_HREF } from "@/lib/marketing/content";
import { TERMS_META, TERMS_SECTIONS } from "@/lib/marketing/terms-content";
import "@/app/(marketing)/marketing.css";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { TermsToc } from "@/components/marketing/terms-toc";
import { TermsContent } from "@/components/marketing/terms-content";

export const metadata = { title: "Terms & Conditions — Hapag" };

/**
 * Real Terms & Conditions page (specs/032-terms-conditions) — replaces the
 * placeholder shipped by specs/030-marketing-homepage.
 *
 * Deliberately stays at this existing top-level route rather than moving
 * under the `(marketing)` route group (no URL change, no unnecessary
 * route-move churn — research.md Decision 3), mirroring
 * src/app/privacy/page.tsx (specs/031) exactly; instead it imports the same
 * marketing chrome and fonts that group's layout.tsx uses (FR-003, FR-004).
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

export default function TermsPage() {
  return (
    <div className={`marketing-page ${fraunces.variable} ${bricolageGrotesque.variable}`}>
      <MarketingNav registerHref={REGISTER_HREF} />
      <main className="px-5 pt-16 min-[900px]:px-10">
        <TermsToc sections={TERMS_SECTIONS} />
        <TermsContent sections={TERMS_SECTIONS} meta={TERMS_META} />
      </main>
      <MarketingFooter />
    </div>
  );
}
