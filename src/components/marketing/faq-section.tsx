"use client";

import { useEffect, useRef } from "react";
import { FAQ_ENTRIES } from "@/lib/marketing/content";

/**
 * specs/030-marketing-homepage FR-012. Native <details>/<summary> — not a
 * JS-only accordion, so content survives a JS failure (Edge Cases). The
 * answer's max-height is measured and animated toward its real scrollHeight
 * on open/close (a native [open]<->closed toggle can't animate — the
 * browser snaps content to `display: none` the instant [open] is removed).
 * The real `[open]` attribute is only synced at the start of an open / end
 * of a close, so a JS failure still leaves a working native accordion —
 * see marketing.css's `details[open] > .mkt-faq-answer-wrap` fallback
 * rule, which only takes effect when JS never sets the wrap's inline
 * max-height at all.
 */
export function FaqSection() {
  const wrapRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const itemRefs = useRef<Record<string, HTMLDetailsElement | null>>({});

  // Establishes an inline max-height:0 baseline on mount, JS-side only —
  // without this, the very first open on any item has no inline style
  // yet, so the no-JS fallback rule wins instantly, snapping the answer
  // open with no transition. Setting this from an effect (not the initial
  // JSX `style` prop) keeps it JS-only.
  useEffect(() => {
    Object.values(wrapRefs.current).forEach((wrap) => {
      if (wrap) wrap.style.maxHeight = "0px";
    });
  }, []);

  function handleToggle(question: string, e: React.MouseEvent) {
    e.preventDefault();
    const item = itemRefs.current[question];
    const wrap = wrapRefs.current[question];
    if (!item || !wrap) return;

    if (item.classList.contains("is-open")) {
      // closing — from the fully-open measured height back to 0
      wrap.style.maxHeight = `${wrap.scrollHeight}px`;
      item.classList.remove("is-open");
      requestAnimationFrame(() => {
        wrap.style.maxHeight = "0px";
      });
      const onEnd = (ev: TransitionEvent) => {
        if (ev.target !== wrap || ev.propertyName !== "max-height") return;
        wrap.removeEventListener("transitionend", onEnd);
        item.open = false;
      };
      wrap.addEventListener("transitionend", onEnd);
    } else {
      // opening — [open] first so scrollHeight measures real content
      item.open = true;
      item.classList.add("is-open");
      requestAnimationFrame(() => {
        wrap.style.maxHeight = `${wrap.scrollHeight}px`;
      });
    }
  }

  return (
    <section id="faq" className="px-5 py-[112px] min-[900px]:px-10 min-[900px]:py-[160px]">
      <div className="mkt-section-head mkt-reveal">
        <h2>Frequently asked questions</h2>
      </div>
      <div className="mkt-faq-list mx-auto grid max-w-[990px] grid-cols-1 gap-3.5 min-[640px]:grid-cols-2 min-[640px]:items-start min-[640px]:gap-x-5">
        {FAQ_ENTRIES.map((entry) => (
          <details
            key={entry.question}
            ref={(el) => {
              itemRefs.current[entry.question] = el;
            }}
            className="mkt-faq-item mkt-reveal group rounded-2xl bg-[var(--mkt-peach)] px-6"
          >
            <summary
              onClick={(e) => handleToggle(entry.question, e)}
              className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[1.02rem] font-bold text-[var(--mkt-orange)] marker:content-none"
            >
              {entry.question}
              <span
                aria-hidden="true"
                className="relative h-[18px] w-[18px] shrink-0 text-[var(--mkt-ink)] after:absolute after:top-1/2 after:left-0 after:h-0.5 after:w-full after:-translate-y-1/2 after:bg-current before:absolute before:top-0 before:left-1/2 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-current before:transition-transform group-[.is-open]:before:scale-y-0"
              />
            </summary>
            <div
              ref={(el) => {
                wrapRefs.current[entry.question] = el;
              }}
              className="mkt-faq-answer-wrap max-h-0 overflow-hidden transition-[max-height] duration-[350ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
            >
              <p className="max-w-[66ch] pb-[22px] text-[0.95rem] leading-[1.6] text-[var(--mkt-ink)]">
                {entry.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
