"use client";

import { useEffect, useState } from "react";
import type { MenuDisplayCategory } from "@/components/menu/category-tabs";

// Consolidates the cat/q/item URL-state pattern (spec FR-009) into one hook,
// ported from qr-menu-dev's use-menu-url-state.ts (research.md Decision 3).
//
// Never imports next/navigation's useRouter/redirect: only
// window.history.replaceState and a manual popstate listener — Next's
// client Router Cache can restore a stale cached render on a native
// back/forward gesture, since history.replaceState updates the address bar
// without Next's router ever learning about it; window.location is always
// accurate even when the restored props aren't.
//
// cat/item store a position index into sourceCategories/its flattened items,
// not the category/item uuid — short, and stable for the lifetime of one
// page load since that order doesn't change without a reload.
function flattenItemIds(sourceCategories: MenuDisplayCategory[]): string[] {
  return sourceCategories.flatMap((category) => category.items.map((item) => item.id));
}

function categoryIdFromIndex(
  sourceCategories: MenuDisplayCategory[],
  index: string | undefined
): string | undefined {
  if (index === undefined) return undefined;
  return sourceCategories[Number(index)]?.id;
}

function categoryIndexFromId(sourceCategories: MenuDisplayCategory[], id: string): string | undefined {
  const index = sourceCategories.findIndex((category) => category.id === id);
  return index === -1 ? undefined : String(index);
}

export function useMenuUrlState({
  sourceCategories,
  initialCategoryIndex,
  initialQuery,
  initialItemIndex,
}: {
  sourceCategories: MenuDisplayCategory[];
  initialCategoryIndex?: string;
  initialQuery?: string;
  initialItemIndex?: string;
}) {
  const initialCategoryId = categoryIdFromIndex(sourceCategories, initialCategoryIndex);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(
    sourceCategories.some((category) => category.id === initialCategoryId)
      ? initialCategoryId!
      : (sourceCategories[0]?.id ?? null)
  );
  const [query, setQueryState] = useState(initialQuery ?? "");
  const initialItemId =
    initialItemIndex !== undefined
      ? flattenItemIds(sourceCategories)[Number(initialItemIndex)]
      : undefined;
  const [expandedItemId, setExpandedItemId] = useState<string | null>(initialItemId ?? null);

  // Next's client Router Cache can restore a stale cached render (the
  // original pre-tap props) on a native back/forward gesture, since our
  // history.replaceState calls below update the address bar without Next's
  // router ever learning about it. window.location is always accurate even
  // when the restored props aren't, so re-sync from it on mount and on
  // every popstate rather than trusting the initial* props alone.
  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);

      const catFromUrl = categoryIdFromIndex(sourceCategories, params.get("cat") ?? undefined);
      if (catFromUrl && sourceCategories.some((category) => category.id === catFromUrl)) {
        setActiveCategoryId(catFromUrl);
      }

      setQueryState(params.get("q") ?? "");
      const itemIndex = params.get("item");
      setExpandedItemId(
        itemIndex !== null ? (flattenItemIds(sourceCategories)[Number(itemIndex)] ?? null) : null
      );
    }
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [sourceCategories]);

  function selectCategory(categoryId: string) {
    setActiveCategoryId(categoryId);
    const url = new URL(window.location.href);
    const index = categoryIndexFromId(sourceCategories, categoryId);
    if (index !== undefined) {
      url.searchParams.set("cat", index);
    }
    window.history.replaceState(null, "", url);
  }

  function setQuery(value: string) {
    setQueryState(value);
    const url = new URL(window.location.href);
    if (value.trim()) {
      url.searchParams.set("q", value);
    } else {
      // Clearing q also clears item (spec FR-011): there is no category
      // context to keep a search-originated item open against once the flat
      // result list it was part of disappears.
      setExpandedItemId(null);
      url.searchParams.delete("q");
      url.searchParams.delete("item");
    }
    window.history.replaceState(null, "", url);
  }

  function toggleItem(itemId: string) {
    const url = new URL(window.location.href);
    if (itemId === expandedItemId) {
      setExpandedItemId(null);
      url.searchParams.delete("item");
    } else {
      // Only one item expanded at a time — always replaces the previous
      // value, never appends.
      setExpandedItemId(itemId);
      const index = flattenItemIds(sourceCategories).indexOf(itemId);
      if (index !== -1) {
        url.searchParams.set("item", String(index));
      }
    }
    window.history.replaceState(null, "", url);
  }

  return { activeCategoryId, query, expandedItemId, selectCategory, setQuery, toggleItem };
}
