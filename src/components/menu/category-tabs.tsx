"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MenuItemCard, type MenuDisplayItem } from "@/components/menu/menu-item-card";

export type MenuDisplayCategory = {
  id: string;
  name: string;
  items: MenuDisplayItem[];
};

export function CategoryTabs({ categories }: { categories: MenuDisplayCategory[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");

  if (categories.length === 0) {
    return <p className="px-4 py-6 text-sm text-muted-foreground">No menu items yet.</p>;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Non-scrolling sibling above the scrollable item region — never
          moves out of view without relying on CSS position:sticky (matches
          qr-menu-dev's own layout choice, research.md/tasks.md T009). */}
      <nav className="flex shrink-0 gap-2 overflow-x-auto border-b border-border px-4 py-3">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategoryId(category.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap",
              category.id === activeCategoryId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
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
              "flex flex-col divide-y divide-border",
              category.id !== activeCategoryId && "hidden"
            )}
          >
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
