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
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        className="flex w-full gap-3 py-3 text-left disabled:cursor-default"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {item.photoUrl && !failed ? (
            <Image
              loader={cloudinaryLoader}
              src={item.photoUrl}
              alt=""
              fill
              sizes="64px"
              className={cn("object-cover", item.isSoldOut && "grayscale-[70%]")}
              onError={() => setFailed(true)}
            />
          ) : (
            <div
              className={cn(
                "flex size-full items-center justify-center",
                item.isSoldOut && "grayscale-[70%]"
              )}
            >
              <ImageOff className="size-5 text-muted-foreground" />
            </div>
          )}
          {item.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-xs font-bold text-white">Sold Out</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 font-medium">
            {item.isBestSeller && (
              <Star
                className="size-3.5 shrink-0 fill-amber-400 text-amber-400"
                aria-label="Best seller"
              />
            )}
            <span className="truncate">{item.name}</span>
          </span>
          {item.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          )}
          <span className="text-sm font-medium">{formatPrice(item.price)}</span>
        </div>
      </button>
    </li>
  );
}
