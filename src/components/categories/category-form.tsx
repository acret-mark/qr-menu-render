"use client";

import { useState } from "react";
import { saveCategory } from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };

export function CategoryForm({
  category,
  open,
  onOpenChange,
}: {
  category?: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset for the next time this dialog opens in "add" mode.
      setName(category?.name ?? "");
      setError(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await saveCategory({ id: category?.id, name });
    setSubmitting(false);

    if (!result.ok) {
      setError(
        result.reason === "empty-name" ? "Name is required." : "Couldn't save. Please try again."
      );
      return;
    }

    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit category" : "Add category"}</DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="category-name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Appetizers"
              autoFocus
              className={cn(
                "h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                error && "border-destructive"
              )}
              aria-invalid={!!error}
            />
            {error && <span className="text-xs text-destructive">{error}</span>}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
