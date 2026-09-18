"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MenuItemRow, type MenuItemRowItem } from "@/components/items/menu-item-row";

export type MenuItemListCategory = {
  id: string;
  name: string;
  items: MenuItemRowItem[];
};

export function MenuItemList({
  categories,
  locked = false,
}: {
  categories: MenuItemListCategory[];
  locked?: boolean;
}) {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const activeCategory = categories.find((c) => c.id === activeCategoryId) ?? categories[0];

  return (
    <>
      <nav className="overflow-x-auto border-b border-border px-4 py-3.5">
        <ul className="flex gap-2">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[0.88rem] font-medium",
                  category.id === activeCategory?.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground"
                )}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {activeCategory && activeCategory.items.length === 0 && (
        <p className="px-4 py-8 text-center text-base text-muted-foreground">
          No items in this category yet.
        </p>
      )}

      {activeCategory && activeCategory.items.length > 0 && (
        <ul className="divide-y divide-border">
          {activeCategory.items.map((item) => (
            <MenuItemRow key={item.id} item={item} locked={locked} />
          ))}
        </ul>
      )}
    </>
  );
}
