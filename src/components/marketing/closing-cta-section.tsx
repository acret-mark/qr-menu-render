import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// specs/030-marketing-homepage. A 28px-radius panel (deliberately not
// --mkt-radius-card's 20px — a one-off larger radius just for this panel),
// with the image deliberately bleeding past the panel's edges via negative
// margins (overflow: visible on the panel) rather than being contained
// within it.
export function ClosingCtaSection({ registerHref }: { registerHref: string }) {
  return (
    <section className="px-5 pt-14 pb-[88px] min-[900px]:px-10 min-[900px]:pt-[72px] min-[900px]:pb-[128px]">
      <div className="mkt-reveal mx-auto flex max-w-[990px] flex-col-reverse items-center gap-6 overflow-visible rounded-[28px] bg-[var(--mkt-orange)] px-16 pt-14 pb-0 text-center text-white min-[900px]:flex-row min-[900px]:justify-between min-[900px]:px-16 min-[900px]:py-0 min-[900px]:text-left">
        <div className="mkt-reveal mkt-pop w-[calc(100%+128px)] max-w-[460px] -mx-16 -mb-20 min-[900px]:mx-0 min-[900px]:mb-[-100px] min-[900px]:w-[560px] min-[900px]:max-w-none min-[900px]:shrink-0">
          <Image
            src="/marketing/cta-phones.webp"
            alt="Two phone screens: the Hapag scan-browse-order hero screen and a QR menu demo."
            width={560}
            height={642}
            className="block h-auto w-full"
          />
        </div>
        <div className="w-full min-[900px]:w-auto">
          <h2 className="text-[2.3rem]">Your menu, live today.</h2>
          <p className="mx-auto mt-3.5 mb-[26px] max-w-[42ch] text-white/88 min-[900px]:mx-0">
            Register, add your items, and generate your QR code — no printing, no waiting on a
            designer.
          </p>
          <Button
            render={<Link href={registerHref} />}
            nativeButton={false}
            size="lg"
            className="h-auto w-full rounded-[var(--mkt-radius-pill)] bg-[#fff9f7] px-7 py-3.5 text-[0.95rem] font-bold text-[var(--mkt-orange)] hover:bg-white"
          >
            Get Started
          </Button>
        </div>
      </div>
    </section>
  );
}
