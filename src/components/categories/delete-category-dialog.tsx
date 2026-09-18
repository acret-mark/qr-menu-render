"use client";

import { useState } from "react";
import { deleteCategory } from "@/lib/categories/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DeleteCategoryDialog({
  categoryId,
  categoryName,
  itemCount,
  open,
  onOpenChange,
}: {
  categoryId: string;
  categoryName: string;
  itemCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const result = await deleteCategory({ id: categoryId });
    setDeleting(false);

    if (!result.ok) {
      setError("Couldn't delete. Please try again.");
      return;
    }

    onOpenChange(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {itemCount > 0 ? "Delete category and its items?" : "Delete this category?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {itemCount > 0
              ? `Delete "${categoryName}" and its ${itemCount} item${itemCount === 1 ? "" : "s"}? This can't be undone.`
              : `Delete "${categoryName}"? This can't be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={handleConfirm}
          >
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
