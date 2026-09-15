"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Receipt } from "lucide-react";

/**
 * Payment-proof preview for the Payment Queue (specs/012-payment-queue
 * FR-004/FR-005). Three states: a normal thumbnail, "no proof submitted"
 * when the owner never uploaded one (the row still lists — that's exactly
 * what an admin needs to notice), and a fallback when the URL is present
 * but the image won't load.
 *
 * Uses next/image, not a plain <img> (research.md Decision 4) —
 * next.config.ts already declares images.remotePatterns for
 * res.cloudinary.com (specs/007), unlike qr-menu-dev at the time it built
 * this component.
 */
export function PaymentProofThumb({
  url,
  businessName,
}: {
  url: string | null;
  businessName: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    const label = url
      ? `Payment proof for ${businessName} could not be loaded`
      : `No payment proof submitted for ${businessName}`;
    const Icon = url ? ImageOff : Receipt;

    return (
      <div
        role="img"
        aria-label={label}
        title={label}
        className="flex size-8 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground"
      >
        <Icon className="size-3.5" aria-hidden />
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="relative block size-8 overflow-hidden rounded-md border border-border"
      title={`View full-size payment proof for ${businessName}`}
    >
      <Image
        src={url}
        alt={`Payment proof submitted by ${businessName}`}
        fill
        sizes="32px"
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </a>
  );
}
