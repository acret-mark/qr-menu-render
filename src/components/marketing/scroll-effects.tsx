"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * specs/030-marketing-homepage FR-020. Cross-cutting motion: scroll-reveal
 * for `.mkt-reveal` sections and the scroll-to-top button (visible after
 * ~0.8 viewport heights, matching marketing.css's threshold). Gated behind
 * prefers-reduced-motion; the reveal CSS in marketing.css already keeps
 * content visible by default outside that query, so a JS failure here
 * never hides anything — this only adds the reveal animation on top of
 * content that's already there.
 */
export function ScrollEffects() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let observer: IntersectionObserver | undefined;
    if (!reduceMotion) {
      const targets = document.querySelectorAll(".mkt-reveal");
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            entry.target.classList.toggle("is-visible", entry.isIntersecting);
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
      );
      targets.forEach((el) => observer!.observe(el));
    }

    function onScroll() {
      setShowTop(window.scrollY > window.innerHeight * 0.8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        })
      }
      aria-label="Scroll to top"
      className={`fixed right-5 bottom-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mkt-orange)] text-white shadow-[var(--mkt-shadow-sm)] transition-all duration-250 hover:bg-[var(--mkt-orange-deep)] ${
        showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
}
