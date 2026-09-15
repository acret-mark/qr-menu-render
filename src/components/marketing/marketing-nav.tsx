"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { NAV_LINKS, LOGIN_HREF } from "@/lib/marketing/content";
import { Button } from "@/components/ui/button";

/**
 * specs/030-marketing-homepage. Sticky marketing nav — hides on
 * scroll-down, reappears on scroll-up (FR-020), never fully hidden while
 * the mobile menu is open. Nav links/login/register CTA are all hidden
 * below 900px (FR-011) — the top bar shows only the logo and hamburger on
 * mobile, with Login + Get Started living in the dropdown instead — a
 * deliberate two-tap mobile registration path, not a defect (SC-002).
 */
export function MarketingNav({ registerHref }: { registerHref: string }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const menuRef = useRef<HTMLElement | null>(null);
  const [menuMaxHeight, setMenuMaxHeight] = useState(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      if (menuOpen) {
        lastY.current = window.scrollY;
        return;
      }
      const currentY = window.scrollY;
      if (currentY > lastY.current && currentY > 80) {
        setHidden(true);
      } else if (currentY < lastY.current) {
        setHidden(false);
      }
      lastY.current = currentY;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  // Measures the dropdown's real scrollHeight and animates max-height
  // toward it (a native max-height:0->auto transition can't animate
  // smoothly), so the mobile menu opens/closes with a real slide instead
  // of an instant snap.
  useEffect(() => {
    if (!menuRef.current) return;
    if (menuOpen) {
      setMenuMaxHeight(menuRef.current.scrollHeight);
    } else {
      setMenuMaxHeight(0);
    }
  }, [menuOpen]);

  // Re-measures if the open menu's content reflows (e.g. orientation
  // change) — its measured height can otherwise go stale.
  useEffect(() => {
    function onResize() {
      if (menuOpen && menuRef.current) setMenuMaxHeight(menuRef.current.scrollHeight);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [menuOpen]);

  return (
    <header
      id="top"
      className={`sticky top-0 z-50 bg-[var(--mkt-orange)] text-white transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div className="relative mx-auto flex max-w-[990px] items-center justify-between gap-4 px-5 py-4 min-[900px]:px-10 min-[900px]:py-[18px]">
        <Link href="#top" className="shrink-0">
          <Image src="/brand-inverted.png" alt="Hapag" width={541} height={154} priority className="h-14 w-auto" />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden gap-8 text-[0.95rem] font-medium [font-family:var(--font-bricolage),var(--font-inter),-apple-system,sans-serif] min-[900px]:absolute min-[900px]:top-1/2 min-[900px]:left-1/2 min-[900px]:flex min-[900px]:-translate-x-1/2 min-[900px]:-translate-y-1/2"
        >
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="opacity-95 hover:underline hover:opacity-100">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href={LOGIN_HREF} className="hidden text-[0.92rem] font-bold min-[900px]:inline">
            Login
          </Link>
          <Button
            render={<Link href={registerHref} />}
            nativeButton={false}
            className="hidden h-auto rounded-[var(--mkt-radius-pill)] bg-[#fff9f7] px-7 py-3.5 text-[0.95rem] font-bold text-[var(--mkt-orange)] hover:bg-white min-[900px]:inline-flex"
          >
            Get Started
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 items-center justify-center rounded-md text-white min-[900px]:hidden"
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line
                x1="2"
                y1="7"
                x2="22"
                y2="7"
                className={`origin-center transition-transform duration-300 [transform-box:fill-box] ${menuOpen ? "translate-y-[5px] rotate-45" : ""}`}
              />
              <line
                x1="2"
                y1="12"
                x2="22"
                y2="12"
                className={`origin-center transition-opacity duration-300 [transform-box:fill-box] ${menuOpen ? "opacity-0" : ""}`}
              />
              <line
                x1="2"
                y1="17"
                x2="22"
                y2="17"
                className={`origin-center transition-transform duration-300 [transform-box:fill-box] ${menuOpen ? "-translate-y-[5px] -rotate-45" : ""}`}
              />
            </svg>
          </button>
        </div>

        {/* Floating dropdown card — absolute, anchored under the hamburger,
            not a full-width bar. Always rendered (not conditional) so its
            real scrollHeight can be measured and animated toward — collapsed
            by default via max-height:0, overflow:hidden. */}
        <nav
          ref={menuRef}
          aria-label="Mobile"
          aria-hidden={!menuOpen}
          style={{ maxHeight: menuMaxHeight }}
          className={`absolute top-full right-5 mt-2.5 flex w-[min(300px,calc(100vw-40px))] flex-col gap-1 overflow-hidden rounded-2xl bg-[var(--mkt-orange)] px-[22px] shadow-[var(--mkt-shadow-md)] transition-[max-height,opacity] duration-[350ms] ease-[cubic-bezier(0.65,0,0.35,1)] min-[900px]:hidden ${
            menuOpen ? "pt-2.5 pb-[22px] opacity-100" : "pointer-events-none pt-0 pb-0 opacity-0"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              tabIndex={menuOpen ? undefined : -1}
              onClick={() => setMenuOpen(false)}
              className="border-t border-white/20 py-3.5 text-[1.1rem] font-semibold first:border-t-0"
            >
              {link.label}
            </a>
          ))}
          <Link
            href={LOGIN_HREF}
            tabIndex={menuOpen ? undefined : -1}
            onClick={() => setMenuOpen(false)}
            className="border-t border-white/20 py-3.5 text-[1.1rem] font-semibold"
          >
            Login
          </Link>
          <Button
            render={
              <Link href={registerHref} tabIndex={menuOpen ? undefined : -1} onClick={() => setMenuOpen(false)} />
            }
            nativeButton={false}
            className="mt-3 h-auto w-full rounded-[var(--mkt-radius-pill)] bg-[#fff9f7] px-7 py-3.5 text-[0.95rem] font-bold text-[var(--mkt-orange)] hover:bg-white"
          >
            Get Started
          </Button>
        </nav>
      </div>
    </header>
  );
}
