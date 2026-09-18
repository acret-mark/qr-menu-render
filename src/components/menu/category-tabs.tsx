"use client";

import { cn } from "@/lib/utils";
import { MenuItemCard, type MenuDisplayItem } from "@/components/menu/menu-item-card";

export type MenuDisplayCategory = {
  id: string;
  name: string;
  items: MenuDisplayItem[];
};

export function CategoryTabs({
  categories,
  activeCategoryId,
  onSelectCategory,
  onOpenItem,
}: {
  categories: MenuDisplayCategory[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
  onOpenItem: (itemId: string) => void;
}) {
  if (categories.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No menu items yet.</p>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Non-scrolling sibling above the scrollable item region — never
          moves out of view without relying on CSS position:sticky (matches
          qr-menu-dev's own layout choice, research.md/tasks.md T009). */}
      <nav className="mt-2 flex shrink-0 gap-2 overflow-x-auto border-b border-border bg-background px-4 py-3.5">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[0.88rem] font-medium",
              category.id === activeCategoryId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-primary bg-card text-primary"
            )}
          >
            {category.name}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-4">
        {categories.map((category) => (
          <ul
            key={category.id}
            className={cn(
              "flex flex-col gap-6 pb-6 pt-4",
              category.id !== activeCategoryId && "hidden"
            )}
          >
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} onOpen={() => onOpenItem(item.id)} />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
