"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";

export function AddCategoryFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* bottom-20/z-50 (not bottom-6/default stacking): OwnerTabBar is a
          fixed, opaque bar pinned to bottom-0 at z-40 — anything at bottom-6
          with no z-index renders underneath it and is invisible, even
          though it's technically present and "visible" in the DOM. Right
          offset mirrors the content column's own max-w-2xl/px-6 so the FAB
          stays aligned to the column's edge on wide viewports instead of
          the raw browser edge. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add category"
        className="fixed right-[max(1.5rem,calc((100vw-42rem)/2+1.5rem))] bottom-20 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={24} />
      </button>
      <CategoryForm open={open} onOpenChange={setOpen} />
    </>
  );
}
