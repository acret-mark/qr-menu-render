"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Star, ImageOff, TriangleAlert } from "lucide-react";
import { setItemSoldOut } from "@/lib/items/actions";

export type MenuItemRowItem = {
  id: string;
  name: string;
  price: string;
  isSoldOut: boolean;
  isBestSeller: boolean;
  hasStaleTranslation: boolean;
};

function formatPrice(price: string): string {
  const n = Number(price);
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function MenuItemRow({ item }: { item: MenuItemRowItem }) {
  const [isSoldOut, setIsSoldOut] = useState(item.isSoldOut);
  const [saveFailed, setSaveFailed] = useState(false);
  // Guards against a stale, slower response clobbering a newer toggle if
  // the owner flips the switch again before the first save settles
  // (spec Edge Cases — "ends up reflecting the owner's last requested
  // state once all in-flight saves settle").
  const requestIdRef = useRef(0);

  async function handleToggle(nextAvailable: boolean) {
    const nextSoldOut = !nextAvailable;
    const requestId = ++requestIdRef.current;

    setIsSoldOut(nextSoldOut);
    setSaveFailed(false);

    const result = await setItemSoldOut({ id: item.id, isSoldOut: nextSoldOut });

    if (requestId !== requestIdRef.current) return; // a newer toggle already superseded this one

    if (!result.ok) {
      setIsSoldOut(!nextSoldOut); // revert to last-saved state
      setSaveFailed(true);
      setTimeout(() => setSaveFailed(false), 4000);
    }
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
        <ImageOff className="size-5 text-muted-foreground" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-1.5 truncate font-medium">
          {item.isBestSeller && (
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Best seller" />
          )}
          <span className="truncate">{item.name}</span>
        </span>
        <span className="text-xs text-muted-foreground">{formatPrice(item.price)}</span>
        {item.hasStaleTranslation && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <TriangleAlert className="size-3.5" />
            Translation pending
          </span>
        )}
        {saveFailed && (
          <span className="mt-1 text-xs text-destructive">Couldn&apos;t save — try again.</span>
        )}
      </div>

      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Available
        <input
          type="checkbox"
          checked={!isSoldOut}
          onChange={(e) => handleToggle(e.target.checked)}
          className="size-4"
          aria-label={`${item.name} available`}
        />
      </label>

      <Link
        href={`/menu/${item.id}/edit`}
        aria-label={`Edit ${item.name}`}
        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Pencil className="size-4" />
      </Link>
    </li>
  );
}
