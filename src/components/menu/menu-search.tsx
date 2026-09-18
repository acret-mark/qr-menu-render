"use client";

import { CategoryTabs, type MenuDisplayCategory } from "@/components/menu/category-tabs";
import { ItemDetailSheet } from "@/components/menu/item-detail-sheet";
import { SearchInput } from "@/components/menu/search-input";
import { SearchResults } from "@/components/menu/search-results";
import { useMenuUrlState } from "@/lib/menu/use-menu-url-state";
import { filterItems } from "@/lib/menu/search";

export function MenuSearch({
  categories,
  initialCategoryIndex,
  initialQuery,
  initialItemIndex,
}: {
  categories: MenuDisplayCategory[];
  initialCategoryIndex?: string;
  initialQuery?: string;
  initialItemIndex?: string;
}) {
  const { activeCategoryId, query, expandedItemId, selectCategory, setQuery, toggleItem } =
    useMenuUrlState({
      sourceCategories: categories,
      initialCategoryIndex,
      initialQuery,
      initialItemIndex,
    });

  const trimmedQuery = query.trim();
  const results = trimmedQuery ? filterItems(categories, query) : [];

  // Looked up from whichever list (search results or the active category)
  // is currently showing it — an id that no longer resolves (item hidden/
  // deleted/business gone since a shared link was made, spec FR-012) simply
  // finds nothing here, so the sheet doesn't render; never an error.
  function findExpandedEntry() {
    if (!expandedItemId) return null;
    if (trimmedQuery) {
      const result = results.find((candidate) => candidate.item.id === expandedItemId);
      return result ? { ...result, fromSearch: true } : null;
    }
    for (const category of categories) {
      const item = category.items.find((candidate) => candidate.id === expandedItemId);
      if (item) return { item, categoryName: category.name, fromSearch: false };
    }
    return null;
  }
  const expandedEntry = findExpandedEntry();

  return (
    // No `relative` here (unlike an earlier version of this file) — the
    // ItemDetailSheet rendered below is `position: absolute`, and leaving
    // this un-positioned lets it fall through to page.tsx's own `relative`
    // shell instead, so its dimmed backdrop covers the header/hero above
    // too, matching qr-menu-dev's menu-home.tsx behavior.
    <div className="flex min-h-0 flex-1 flex-col">
      {/* bg-card + no vertical gap from MenuHeader's identity card above —
          together they read as one continuous rounded panel even though
          the search pill's interactive state stays owned by this
          component's own useMenuUrlState call, not MenuHeader's (matches
          qr-menu-dev's single-panel look without merging the two
          components' state). */}
      <div className="shrink-0 bg-card px-4">
        <SearchInput value={query} onChange={setQuery} />
      </div>
      {trimmedQuery ? (
        <SearchResults query={trimmedQuery} results={results} onOpenItem={toggleItem} />
      ) : (
        <CategoryTabs
          categories={categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={selectCategory}
          onOpenItem={toggleItem}
        />
      )}
      {expandedEntry && (
        <ItemDetailSheet
          item={expandedEntry.item}
          categoryName={expandedEntry.categoryName}
          showCategory={expandedEntry.fromSearch}
          onClose={() => toggleItem(expandedEntry.item.id)}
        />
      )}
    </div>
  );
}
