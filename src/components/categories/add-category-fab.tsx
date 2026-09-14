"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryForm } from "@/components/categories/category-form";

export function AddCategoryFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        aria-label="Add category"
        className="fixed bottom-6 right-6 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Plus />
      </Button>
      <CategoryForm open={open} onOpenChange={setOpen} />
    </>
  );
}
