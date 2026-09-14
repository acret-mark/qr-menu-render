import { Star, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type MenuDisplayItem = {
  id: string;
  name: string; // never translated — always as-authored (FR-011)
  description: string | null; // already translated ?? source, per applyPublicTranslations
  price: string;
  photoUrl: string | null;
  isSoldOut: boolean;
  isBestSeller: boolean;
};

function formatPrice(price: string): string {
  const n = Number(price);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function MenuItemCard({ item }: { item: MenuDisplayItem }) {
  return (
    <li className="flex gap-3 py-3">
      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
        {item.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already optimizes/transforms this URL
          <img
            src={item.photoUrl}
            alt=""
            className={cn("size-full object-cover", item.isSoldOut && "grayscale-[70%]")}
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
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Best seller" />
          )}
          <span className="truncate">{item.name}</span>
        </span>
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        <span className="text-sm font-medium">{formatPrice(item.price)}</span>
      </div>
    </li>
  );
}
