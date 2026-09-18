"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Fraunces } from "next/font/google";
import { ImageOff, Star, X } from "lucide-react";
import { cloudinaryLoader } from "@/lib/images/cloudinary";
import { cn } from "@/lib/utils";
import type { MenuDisplayItem } from "@/components/menu/menu-item-card";

// Full-screen slide-up detail sheet (specs/008-search-item-detail, research.md
// Decision 1) — matches qr-menu-dev's shipped item-detail-sheet.tsx, not its
// superseded pre-merge accordion spec text (Constitution Principle IV).
const TRANSITION_MS = 300;

// Scoped to this one file, same as qr-menu-dev's own item-detail-sheet.tsx —
// next/font/google's build-time transform only bundles this for routes that
// actually import this component. Playfair Display (font-heading, used
// elsewhere in this sheet via the base-layer h1-h4 rule) is already loaded
// globally; this is deliberately a second, different display face for the
// price only, matching qr-menu-dev's visual choice exactly.
const priceFont = Fraunces({ subsets: ["latin"], weight: ["700", "900"], display: "swap" });

function formatPrice(price: string): string {
  const n = Number(price);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function ItemDetailSheet({
  item,
  categoryName,
  showCategory,
  onClose,
}: {
  item: MenuDisplayItem;
  categoryName: string;
  showCategory: boolean;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  // specs/034-performance-optimization-pass FR-009/Edge Cases: same
  // load-failure fallback as MenuItemCard's thumbnail.
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setOpen(true), 20);
    return () => clearTimeout(id);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(onClose, TRANSITION_MS);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  const ingredients = item.ingredients ?? [];

  return (
    <div className="absolute inset-0 z-50" role="dialog" aria-modal="true" aria-label={item.name}>
      <button
        type="button"
        aria-label="Close"
        onClick={handleClose}
        className="absolute inset-0 bg-black/75"
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[85vh] min-h-[60vh] flex-col rounded-t-3xl bg-card transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute left-1/2 top-0 z-10 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-foreground shadow-md"
        >
          <X className="size-5" />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-t-3xl">
          <div
            className={cn(
              "relative h-[28vh] w-full shrink-0 bg-gradient-to-br from-primary to-chart-2 text-primary-foreground/80",
              item.isSoldOut && "grayscale-[70%]"
            )}
          >
            {item.photoUrl && !photoFailed ? (
              <Image
                loader={cloudinaryLoader}
                src={item.photoUrl}
                alt=""
                fill
                sizes="(min-width: 448px) 448px, 100vw"
                className="object-cover"
                priority
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageOff className="size-12 opacity-85" strokeWidth={1.2} />
              </div>
            )}
            {item.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="font-heading text-xl font-bold text-white">Sold Out</span>
              </div>
            )}
          </div>

          <div className="px-5 pb-8 pt-5">
            <div
              className={cn(
                priceFont.className,
                "text-right text-4xl font-bold text-accent tabular-nums"
              )}
            >
              {formatPrice(item.price)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-heading text-xl font-bold">
              <span>{item.name}</span>
              {item.isBestSeller && (
                <Star
                  className="size-[18px] shrink-0 fill-warning text-warning"
                  aria-label="Best seller"
                />
              )}
            </div>
            {item.description && (
              <p className="mt-3 text-[0.92rem] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            )}
            {ingredients.length > 0 && (
              <p className="mt-2 text-[0.85rem] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">Ingredients: </span>
                {ingredients.map((ingredient) => ingredient.name).join(", ")}
              </p>
            )}
            {showCategory && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-primary px-3.5 py-1.5 text-[0.82rem] font-medium text-primary">
                  {categoryName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
