"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ImageOff } from "lucide-react";
import { cloudinaryLoader } from "@/lib/images/cloudinary";
import { cn } from "@/lib/utils";

export type MenuDisplayItem = {
  id: string;
  name: string; // never translated — always as-authored (FR-011)
  description: string | null; // already translated ?? source, per applyPublicTranslations
  price: string;
  photoUrl: string | null;
  isSoldOut: boolean;
  isBestSeller: boolean;
  // Translated ?? source per name (spec 008 FR-017); absent/[] when the
  // item has none — never an empty-placeholder line (spec 008 FR-014).
  ingredients?: { id: string; name: string }[];
};

function formatPrice(price: string): string {
  const n = Number(price);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function MenuItemCard({
  item,
  onOpen,
}: {
  item: MenuDisplayItem;
  onOpen?: () => void;
}) {
  // specs/034-performance-optimization-pass FR-009/Edge Cases: a photo that
  // fails to load or transform (not merely absent) falls back to the same
  // ImageOff treatment as a missing photoUrl, instead of the browser's
  // native broken-image glyph breaking the row's layout.
  const [failed, setFailed] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        disabled={!onOpen}
        className="flex w-full gap-4 text-left disabled:cursor-default"
      >
        <div
          className={cn(
            "relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-primary-foreground/80",
            item.isSoldOut && "grayscale-[70%]"
          )}
        >
          {item.photoUrl && !failed ? (
            <Image
              loader={cloudinaryLoader}
              src={item.photoUrl}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff size={36} strokeWidth={1.5} className="opacity-85" />
            </div>
          )}
          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="font-heading text-base font-bold text-white">Sold Out</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col pt-1">
          <div className="flex items-center gap-1.5 font-heading text-[1.05rem] font-bold">
            <span className="truncate">{item.name}</span>
            {item.isBestSeller && (
              <Star
                className="size-4 shrink-0 fill-warning text-warning"
                aria-label="Best seller"
              />
            )}
          </div>
          {item.description && (
            <div className="mt-1 line-clamp-2 text-[0.85rem] text-muted-foreground">
              {item.description}
            </div>
          )}
          <div className="mt-2 text-[1.05rem] font-bold text-accent tabular-nums">
            {formatPrice(item.price)}
          </div>
        </div>
      </button>
    </li>
  );
}
