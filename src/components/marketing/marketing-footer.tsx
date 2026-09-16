import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS } from "@/lib/marketing/content";

// specs/030-marketing-homepage FR-013. A centered column (logo above nav
// links, not side-by-side) with the nav links hidden entirely below
// 900px — mobile visitors get no footer nav at all, matching the design
// reference (this route's footer is intentionally sparser on mobile than
// a typical app footer).
export function MarketingFooter() {
  return (
    <footer>
      <div className="px-5 pt-[72px] pb-14 text-center min-[900px]:px-10 min-[900px]:pt-24 min-[900px]:pb-16">
        {/* Not a link — MarketingNav's logo already gives every page using
            this footer a "back to home" link, so a second one here would
            be redundant. */}
        <div className="mb-5 flex justify-center">
          <Image src="/brand.png" alt="Hapag" width={530} height={154} className="h-14 w-auto" />
        </div>
        <nav
          aria-label="Footer"
          className="hidden flex-wrap justify-center gap-6 text-[0.92rem] font-bold min-[900px]:flex"
        >
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-[var(--mkt-orange)] hover:underline">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="bg-[var(--mkt-orange)] text-[0.82rem] text-white">
        <div className="mx-auto flex max-w-[990px] flex-wrap items-center justify-between gap-3 px-5 py-[18px] max-[599px]:flex-col max-[599px]:text-center">
          <span>© 2026 All rights reserved</span>
          <span className="flex gap-5">
            <Link href="/terms" className="font-semibold hover:underline">
              Terms &amp; conditions
            </Link>
            <Link href="/privacy" className="font-semibold hover:underline">
              Privacy Policy
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
