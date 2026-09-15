import { Fraunces, Bricolage_Grotesque } from "next/font/google";
import "./marketing.css";

/**
 * specs/030-marketing-homepage. Fonts scoped to this route group only
 * (`/`) — not the root layout — so they don't add weight to every other
 * route's bundle (spec SC-005). Playfair Display + Inter are already
 * loaded globally in src/app/layout.tsx and reused as-is here via the same
 * CSS variables already available on <html>.
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

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`marketing-page ${fraunces.variable} ${bricolageGrotesque.variable}`}>
      {/* Safety net (FR-020): ScrollEffects (client component) is what adds
          `.is-visible` to reveal `.mkt-reveal` sections. If JS fails to
          load, that never happens and every section would stay stuck at
          opacity:0 forever — <noscript> only ever renders with JS disabled,
          so this can't fight the real reveal animation when JS does work. */}
      <noscript>
        <style>{`.marketing-page .mkt-reveal { opacity: 1 !important; transform: none !important; }`}</style>
      </noscript>
      {children}
    </div>
  );
}
