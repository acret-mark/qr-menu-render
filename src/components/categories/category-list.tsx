"use client";

import { useState } from "react";
import { Pencil, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/categories/category-form";
import { DeleteCategoryDialog } from "@/components/categories/delete-category-dialog";
import { ReorderControls } from "@/components/categories/reorder-controls";

export type CategoryListItem = {
  id: string;
  name: string;
  itemCount: number;
  hasStaleTranslation: boolean;
};

export function CategoryList({
  categories,
  locked = false,
}: {
  categories: CategoryListItem[];
  locked?: boolean;
}) {
  const [editing, setEditing] = useState<CategoryListItem | null>(null);
  const [deleting, setDeleting] = useState<CategoryListItem | null>(null);

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {locked
          ? "No categories yet."
          : "No categories yet. Use the + button to add your first one."}
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
        {categories.map((category, index) => (
          <li
            key={category.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            {/* specs/020-unified-subscription-lifecycle FR-012: reorder is
                a menu-editing action too — hidden, not just disabled, when
                locked (the server-side reorderCategory already rejects it
                either way). */}
            {!locked && (
              <ReorderControls
                categoryId={category.id}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
              />
            )}

            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{category.name}</span>
              <span className="text-xs text-muted-foreground">
                {category.itemCount} item{category.itemCount === 1 ? "" : "s"}
              </span>
              {category.hasStaleTranslation && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <TriangleAlert className="size-3.5" />
                  Translation pending
                </span>
              )}
            </div>

            {!locked && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${category.name}`}
                  onClick={() => setEditing(category)}
                >
                  <Pencil />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => setDeleting(category)}
                >
                  <Trash2 />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <CategoryForm
          category={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      {deleting && (
        <DeleteCategoryDialog
          categoryId={deleting.id}
          categoryName={deleting.name}
          itemCount={deleting.itemCount}
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
        />
      )}
    </>
  );
}
