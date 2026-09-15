import type { MenuDisplayCategory } from "@/components/menu/category-tabs";
import type { MenuDisplayItem } from "@/components/menu/menu-item-card";

export type SearchResult = { item: MenuDisplayItem; categoryName: string };

/**
 * Case-insensitive substring match against item name and description, over
 * the already-loaded, already-translated category list (research.md
 * Decision 2) — no server round-trip per keystroke. Item name is never
 * translated, so name matching is inherently language-independent; matching
 * against the caller's currently-displayed categories makes description
 * matching naturally language-aware too (spec FR-005).
 */
export function filterItems(categories: MenuDisplayCategory[], query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  return categories.flatMap((category) =>
    category.items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(trimmed) ||
          (item.description?.toLowerCase().includes(trimmed) ?? false)
      )
      .map((item) => ({ item, categoryName: category.name }))
  );
}
