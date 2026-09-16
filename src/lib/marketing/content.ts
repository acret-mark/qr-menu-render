import type { LucideIcon } from "lucide-react";
import { Smartphone, ChefHat, QrCode } from "lucide-react";
import { PLAN_PRICING } from "@/lib/subscriptions/pricing";

/**
 * Static marketing content for the homepage (`/`), specs/030-marketing-
 * homepage. Single-file, typed, so pricing/features stay easy to audit
 * (spec SC-004) — see data-model.md for the full field-by-field contract.
 *
 * IMPORTANT: the two Pro-tier bullets below intentionally do NOT match
 * qr-menu-dev's own design-reference mockup's pricing card copy verbatim
 * ("AI-drafted item descriptions," "Auto-translate: English, Korean,
 * Japanese & Mandarin") — neither is in this project's actual scope (no
 * AI-description feature; only two supported display languages, not four).
 * Corrected here per spec FR-015, matching qr-menu-dev's own already-
 * corrected final shipped copy, not its earlier mockup's literal text.
 */

export const REGISTER_HREF = "/register";
export const LOGIN_HREF = "/login";

export type PricingTier = {
  id: "standard" | "pro";
  name: string;
  priceMonthlyPhp: number;
  features: string[];
  ctaHref: string;
};

// research.md Decision 6: sourced from specs/014's own PLAN_PRICING, not
// restated independently — the one source of truth for these figures.
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "standard",
    name: "Standard",
    priceMonthlyPhp: Number(PLAN_PRICING.standard),
    features: [
      "Menu builder: categories, items, prices, photos",
      '"Ubos Na" sold-out toggle',
      "Best Seller badge",
      "One QR code, generated instantly",
      "Menu shown in your source language",
    ],
    ctaHref: REGISTER_HREF,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthlyPhp: Number(PLAN_PRICING.pro),
    features: [
      "Everything in Standard",
      "Pin best sellers to the top",
      "Language toggle between your two chosen languages",
      'No "Hapag" footer on your menu',
    ],
    ctaHref: REGISTER_HREF,
  },
];

export type FaqEntry = {
  question: string;
  answer: string;
};

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What is a QR menu?",
    answer:
      "A digital menu your customers open by scanning a QR code with their phone's camera. No app to download. Each business gets one QR code, generated on your device, that opens your menu's own link.",
  },
  {
    question: "How is it different from a printed or PDF menu?",
    answer:
      "You update prices, mark items sold out, and highlight best sellers instantly from your phone. Nothing to reprint or re-upload when something changes.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Ask us when you register: trial availability is confirmed with your account, not a fixed self-serve period yet.",
  },
  {
    question: "How long does setup take?",
    answer:
      "As fast as you can register your account, add your items, categories, and prices, and generate your QR code. The builder itself has no waiting period.",
  },
];

export type BenefitItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  screenshotSrc: string | null;
};

/** Consumed by <KeyFeaturesSection /> — the mockup's 3-card "Key Features" section (spec FR-003). */
export const KEY_FEATURES: BenefitItem[] = [
  {
    title: "For Customers",
    description:
      "Scan a QR code, browse a real menu on their own phone: no app to download, no waiting for a printed one.",
    icon: Smartphone,
    screenshotSrc: "/marketing/feature-owners.webp",
  },
  {
    title: "For Owners",
    description:
      "Update prices, mark items sold out, and highlight best sellers in real time, straight from your phone — nothing to reprint when something changes.",
    icon: ChefHat,
    screenshotSrc: "/marketing/feature-customers.webp",
  },
  {
    title: "For your business",
    description:
      "One QR code, generated instantly, downloadable as PNG or PDF for your tables and counter.",
    icon: QrCode,
    screenshotSrc: "/marketing/feature-business.webp",
  },
];

export type StepItem = {
  num: string;
  title: string;
  description: string;
};

/** Consumed by <StepsSection /> — the mockup's "Live in three steps." */
export const STEPS: StepItem[] = [
  {
    num: "01",
    title: "Register & Confirm",
    description: "Create your business account and confirm your email.",
  },
  {
    num: "02",
    title: "Add your Menu",
    description: "Categories, items, prices, and a photo for each dish.",
  },
  {
    num: "03",
    title: "Generate your QR",
    description: "Instantly on your device — download as PNG or PDF for your tables.",
  },
];

export type NavLink = {
  label: string;
  href: string;
};

/**
 * MarketingNav's registration CTA (FR-011) is not a NavLink — see
 * marketing-nav.tsx.
 *
 * Hrefs are root-prefixed (`/#about`, not `#about`): MarketingNav and
 * MarketingFooter are also rendered on /terms and /privacy, which don't
 * have these section ids on the page. A bare `#about` there only rewrites
 * the URL hash with nothing to scroll to; `/#about` always routes through
 * the homepage first, where the target section actually exists, and still
 * behaves as a same-page anchor scroll when already on `/`.
 */
export const NAV_LINKS: NavLink[] = [
  { label: "About", href: "/#about" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];
