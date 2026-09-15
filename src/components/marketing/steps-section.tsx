import { STEPS } from "@/lib/marketing/content";

// specs/030-marketing-homepage. The connecting line is a pure CSS
// ::before on .mkt-steps-grid (marketing.css) — no real DOM element, so
// the step items' own nth-child position (and reveal stagger) isn't
// affected by it.
export function StepsSection() {
  return (
    <section className="bg-[var(--mkt-peach)] px-5 py-[112px] min-[900px]:px-10 min-[900px]:py-[160px]">
      <div className="mkt-section-head mkt-reveal">
        <h2>Live in three steps</h2>
        <p>No printing, no waiting on a designer, no developer required.</p>
      </div>
      <div className="mkt-steps-grid relative mx-auto grid max-w-[990px] grid-cols-1 gap-10 min-[860px]:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.num} className="mkt-reveal relative flex flex-col items-center gap-3 text-center">
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-[var(--mkt-radius-pill)] bg-[var(--mkt-orange)] text-[1.3rem] font-extrabold text-white [font-family:var(--font-playfair-display),Georgia,serif]">
              {step.num}
            </div>
            <h3 className="text-[1.25rem]">{step.title}</h3>
            <p className="max-w-[30ch] text-[0.92rem] text-[var(--mkt-muted)]">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
