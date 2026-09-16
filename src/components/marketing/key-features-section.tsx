import Image from "next/image";
import { KEY_FEATURES } from "@/lib/marketing/content";

/**
 * specs/030-marketing-homepage FR-003. The mockup's 3-card "Key Features"
 * section. Pro-tier differentiators are intentionally NOT repeated here —
 * they live only in <PricingSection>'s per-tier feature list. The "For
 * Owners" card's DOM order is body-then-visual (text above the image) —
 * reversed from the other two cards (visual-then-body) — a deliberate
 * alternating layout.
 */
export function KeyFeaturesSection() {
  return (
    <section id="features" className="px-5 py-[112px] min-[900px]:px-10 min-[900px]:py-[160px]">
      <div className="mkt-section-head mkt-reveal">
        <h2>Key Features</h2>
      </div>
      <div className="mkt-feature-grid mx-auto grid max-w-[990px] grid-cols-1 gap-10 min-[860px]:grid-cols-3 min-[860px]:gap-6">
        {KEY_FEATURES.map((feature) => {
          const isOwners = feature.title === "For Owners";
          const isCustomers = feature.title === "For Customers";
          const isIconOnly = feature.title === "For your business";
          const restTransform = isCustomers
            ? "translate-x-[30px] -translate-y-[10px]"
            : isOwners
              ? "-translate-x-[30px] translate-y-[10px]"
              : "";
          const hoverTransform = isCustomers
            ? "group-hover:translate-x-[30px] group-hover:translate-y-0"
            : isOwners
              ? "group-hover:-translate-x-[30px] group-hover:translate-y-0"
              : "group-hover:scale-[1.08]";

          const visual =
            feature.screenshotSrc && !isIconOnly ? (
              <div
                key="visual"
                className="relative h-[340px] shrink-0 overflow-hidden min-[860px]:h-auto min-[860px]:flex-[0_0_60%]"
              >
                <Image
                  src={feature.screenshotSrc}
                  alt=""
                  fill
                  className={`object-cover transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isOwners ? "object-top" : "object-bottom"} ${restTransform} ${hoverTransform}`}
                />
              </div>
            ) : (
              <div
                key="visual"
                className="flex h-[340px] shrink-0 items-center justify-center py-8 min-[860px]:h-auto min-[860px]:flex-[0_0_60%]"
              >
                {feature.screenshotSrc ? (
                  <Image
                    src={feature.screenshotSrc}
                    alt=""
                    width={170}
                    height={161}
                    className="h-auto w-[170px] transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
                  />
                ) : null}
              </div>
            );

          const body = (
            <div
              key="body"
              className={`flex-1 px-5 pt-4 pb-[18px] ${isOwners ? "grid content-end min-[860px]:flex-[0_0_40%]" : "min-[860px]:flex-[0_0_40%]"}`}
            >
              <h3 className="mb-1.5 text-[1.3rem]">{feature.title}</h3>
              <p className="text-[0.95rem] leading-[1.45] text-[var(--mkt-muted)]">
                {feature.description}
              </p>
            </div>
          );

          return (
            <div
              key={feature.title}
              className="mkt-reveal mkt-pop group flex flex-col overflow-hidden rounded-[var(--mkt-radius-card)] border border-[var(--mkt-orange)] bg-[var(--mkt-peach)] min-[860px]:h-[480px]"
            >
              {isOwners ? (
                <>
                  {body}
                  {visual}
                </>
              ) : (
                <>
                  {visual}
                  {body}
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
