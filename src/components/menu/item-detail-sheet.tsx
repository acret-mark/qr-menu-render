"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageOff, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuDisplayItem } from "@/components/menu/menu-item-card";

// Full-screen slide-up detail sheet (specs/008-search-item-detail, research.md
// Decision 1) — matches qr-menu-dev's shipped item-detail-sheet.tsx, not its
// superseded pre-merge accordion spec text (Constitution Principle IV).
const TRANSITION_MS = 300;

function formatPrice(price: string): string {
  const n = Number(price);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            {item.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already optimizes/transforms this URL
              <img src={item.photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center">
                <ImageOff className="size-12 opacity-85" strokeWidth={1.2} />
              </div>
            )}
            {item.isSoldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-xl font-bold text-white">Sold Out</span>
              </div>
            )}
          </div>

          <div className="px-5 pb-8 pt-5">
            <div className="text-right text-3xl font-bold text-accent tabular-nums">
              {formatPrice(item.price)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xl font-semibold">
              <span>{item.name}</span>
              {item.isBestSeller && (
                <Star
                  className="size-4 shrink-0 fill-amber-400 text-amber-400"
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
