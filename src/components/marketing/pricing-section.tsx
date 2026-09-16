import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_TIERS, type PricingTier } from "@/lib/marketing/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function PricingCard({ tier }: { tier: PricingTier }) {
  const isPro = tier.id === "pro";
  return (
    <div
      className={cn(
        "mkt-reveal mkt-pop flex min-h-[520px] flex-col rounded-[var(--mkt-radius-card)] border p-9",
        isPro
          ? "border-[var(--mkt-orange)] bg-[var(--mkt-peach)]"
          : "border-[var(--mkt-border)] bg-white"
      )}
    >
      <div
        className={cn(
          "text-[0.8rem] font-bold tracking-[0.08em] uppercase",
          isPro ? "text-[var(--mkt-orange)]" : "text-[var(--mkt-muted)]"
        )}
      >
        {tier.name}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5 text-[2.4rem] font-extrabold text-[var(--mkt-ink)] [font-family:var(--font-fraunces),Georgia,serif]">
        ₱{tier.priceMonthlyPhp}
        <span className="text-[0.95rem] font-medium [font-family:var(--font-inter)] text-[var(--mkt-muted)]">
          /mo
        </span>
      </div>
      <hr
        className={cn(
          "mt-5 border-t",
          isPro ? "border-[var(--mkt-orange)]/35" : "border-[var(--mkt-border)]"
        )}
      />
      <ul className="mt-6 mb-8 flex flex-1 flex-col gap-3.5 text-[0.9rem] text-[var(--mkt-ink)]">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 leading-[1.4]">
            <Check
              size={16}
              className={cn("mt-0.5 shrink-0", isPro ? "text-[var(--mkt-orange)]" : "text-[var(--mkt-muted)]")}
            />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        render={<Link href={tier.ctaHref} />}
        nativeButton={false}
        size="lg"
        className={cn(
          "mt-auto h-auto w-full rounded-[var(--mkt-radius-pill)] px-7 py-3.5 text-[0.95rem] font-bold",
          isPro
            ? "bg-[var(--mkt-orange)] text-white hover:bg-[var(--mkt-orange-deep)]"
            : "border border-[var(--mkt-border)] bg-white text-[var(--mkt-ink)] hover:border-[var(--mkt-orange)] hover:bg-white hover:text-[var(--mkt-orange)]"
        )}
      >
        Get Started
      </Button>
      <p className="mt-4 text-center text-[0.8rem] leading-[1.5] text-[var(--mkt-muted)]">
        Activated after bank transfer / GCash proof is verified, not instant checkout.
      </p>
    </div>
  );
}

// specs/030-marketing-homepage FR-002. Reads both tiers' pricing from
// specs/014's own PLAN_PRICING via content.ts's PRICING_TIERS (research.md
// Decision 6) — never a second, independently-maintained copy of the same
// figures.
export function PricingSection() {
  return (
    <section id="pricing" className="px-5 py-[112px] min-[900px]:px-10 min-[900px]:py-[160px]">
      <div className="mkt-section-head mkt-reveal">
        <h2>Simple, transparent pricing</h2>
        <p>Activated after your payment proof is verified: no automatic checkout or card charges.</p>
      </div>
      <div className="mkt-pricing-grid mx-auto grid max-w-[990px] grid-cols-1 gap-6 min-[640px]:grid-cols-2 min-[640px]:gap-16">
        {PRICING_TIERS.map((tier) => (
          <PricingCard key={tier.id} tier={tier} />
        ))}
      </div>
    </section>
  );
}
