"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";

export function AddCategoryFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Add category"
        className="fixed right-[max(1rem,calc((100vw-48rem)/2+1rem))] bottom-20 z-10 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus size={24} />
      </button>
      <CategoryForm open={open} onOpenChange={setOpen} />
    </>
  );
}
