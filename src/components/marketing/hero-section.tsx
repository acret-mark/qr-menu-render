import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * specs/030-marketing-homepage. Hero — headline + primary CTA (FR-001) and
 * the "See it in action" secondary CTA (FR-004), the sole entry point to
 * /demo. The hero itself is plain white with dark ink text; only the
 * buttons and the decorative scan-icon/circle carry the orange color (only
 * the thin nav bar above it is solid orange).
 */
export function HeroSection({ registerHref }: { registerHref: string }) {
  return (
    <section className="overflow-hidden px-5 pt-[72px] pb-[88px] max-[899px]:flex max-[899px]:min-h-screen max-[899px]:items-center min-[900px]:px-10 min-[900px]:pt-[104px] min-[900px]:pb-[120px]">
      <div className="mx-auto flex max-w-[990px] flex-col items-center gap-10 text-center min-[1024px]:flex-row min-[1024px]:justify-between min-[1024px]:gap-14 min-[1024px]:px-5 min-[1024px]:text-left">
        <div className="mkt-hero-copy max-w-[620px]">
          {/* Mobile-only scan icon — the desktop twin-phone photo replaces this at 1024px+ */}
          <svg
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
            className="mkt-hero-scan-icon mx-auto mb-6 h-[260px] w-[260px] pb-6 text-[var(--mkt-orange)] min-[1024px]:hidden"
          >
            <path
              d="M6 30V12a6 6 0 0 1 6-6h18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <path
              d="M94 30V12a6 6 0 0 0-6-6H70"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <path
              d="M6 70v18a6 6 0 0 0 6 6h18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <path
              d="M94 70v18a6 6 0 0 1-6 6H70"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
            <g fill="currentColor">
              <rect x="30" y="30" width="8" height="8" rx="1.5" />
              <rect x="42" y="30" width="8" height="8" rx="1.5" />
              <rect x="30" y="42" width="8" height="8" rx="1.5" />
              <rect x="62" y="30" width="16" height="16" rx="2" />
              <rect x="62" y="54" width="16" height="16" rx="2" />
              <rect x="30" y="54" width="16" height="16" rx="2" />
            </g>
            {/* Scan line — sweeps up/down across the code, ping-pong style, with a glow. */}
            <rect
              className="mkt-scan-line"
              x="4"
              y="47"
              width="92"
              height="4"
              rx="2"
              fill="currentColor"
              opacity="0.85"
            />
          </svg>

          <h1 className="text-[3.8rem] leading-[1.03] font-extrabold min-[1024px]:text-[4.6rem]">
            Scan.
            <br />
            Browse.
            <br />
            Order.
          </h1>
          <p className="mx-auto mt-5 max-w-[46ch] text-[1.2rem] text-[var(--mkt-muted)] min-[1024px]:mx-0">
            No app download needed — it opens straight in the browser.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 min-[480px]:flex-row min-[1024px]:justify-start">
            <Button
              render={<Link href={registerHref} />}
              nativeButton={false}
              size="lg"
              className="h-auto rounded-[var(--mkt-radius-pill)] bg-[var(--mkt-orange)] px-7 py-3.5 text-[0.95rem] font-bold text-white shadow-none hover:bg-[var(--mkt-orange-deep)] hover:shadow-[0_10px_28px_-6px_rgba(243,115,66,0.55)]"
            >
              Get Started
            </Button>
            <Button
              render={<Link href="/demo" />}
              nativeButton={false}
              size="lg"
              variant="outline"
              className="h-auto rounded-[var(--mkt-radius-pill)] border-[var(--mkt-border)] bg-white px-7 py-3.5 text-[0.95rem] font-bold text-[var(--mkt-ink)] hover:border-[var(--mkt-orange)] hover:bg-white hover:text-[var(--mkt-orange)] dark:bg-white dark:hover:bg-white"
            >
              See it in action
            </Button>
          </div>
        </div>

        {/* Desktop-only twin-phone visual with a decorative circle backdrop.
            A plain <picture> with a media-gated <source>, not next/image:
            below 1024px the browser never fetches the desktop photo at
            all — CSS `hidden` alone wouldn't stop the request, only the
            media condition on the <source> itself does. */}
        <div className="mkt-hero-visual relative hidden w-full max-w-[560px] shrink-0 min-[1024px]:block min-[1024px]:w-[clamp(360px,42vw,560px)]">
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-[var(--mkt-orange)]/45 bg-[var(--mkt-orange)]/5"
          />
          <picture className="relative z-10 block">
            <source media="(min-width: 1024px)" srcSet="/marketing/hero-phones.webp" />
            <img
              src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
              alt="Two phone screens: a customer browsing a QR menu, and a three-step onboarding screen."
              width={560}
              height={742}
              className="block h-auto w-full"
            />
          </picture>
        </div>
      </div>
    </section>
  );
}
