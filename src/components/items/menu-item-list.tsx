"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MenuItemRow, type MenuItemRowItem } from "@/components/items/menu-item-row";

export type MenuItemListCategory = {
  id: string;
  name: string;
  items: MenuItemRowItem[];
};

export function MenuItemList({ categories }: { categories: MenuItemListCategory[] }) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategoryId(category.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap",
              category.id === activeCategory?.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {activeCategory && activeCategory.items.length === 0 && (
        <p className="text-sm text-muted-foreground">No items in this category yet.</p>
      )}

      {activeCategory && activeCategory.items.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {activeCategory.items.map((item) => (
            <MenuItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}
