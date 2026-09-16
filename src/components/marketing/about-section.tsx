import Image from "next/image";

// specs/030-marketing-homepage. A decorative 290x290 peach square centered
// behind the photo — not an iPhone-bezel treatment (that's reserved for
// <PhoneFrame> on /demo).
export function AboutSection() {
  return (
    <section id="about" className="px-5 py-[88px] min-[900px]:px-10 min-[900px]:py-[128px]">
      <div className="mkt-about-inner mx-auto flex max-w-[990px] flex-col items-center gap-12 text-center min-[900px]:flex-row min-[900px]:justify-center min-[900px]:gap-20 min-[900px]:text-left">
        <div className="mkt-reveal mkt-pop relative w-full max-w-[340px] shrink-0">
          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 h-[290px] w-[290px] -translate-x-1/2 -translate-y-1/2 rounded-[var(--mkt-radius-card)] border border-[var(--mkt-orange)] bg-[var(--mkt-peach)]"
          />
          <Image
            src="/marketing/about-phone.webp"
            alt="Phone screen showing the Hapag QR scan-to-menu flow."
            width={340}
            height={662}
            className="relative block h-auto w-full"
          />
        </div>
        <div className="mkt-reveal max-w-[520px]">
          <h2 className="text-[2.9rem] leading-[1.15] min-[1024px]:text-[3.4rem]">About Hapag</h2>
          <p className="mt-[18px] text-[1.2rem] text-[var(--mkt-muted)]">
            An instant, app-free QR digital menu for Philippine food businesses. Customers scan,
            see your full menu on their own phone, and you never reprint for a price change again.
          </p>
        </div>
      </div>
    </section>
  );
}
