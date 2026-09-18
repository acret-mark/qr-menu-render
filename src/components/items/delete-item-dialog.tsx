"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteItem } from "@/lib/items/actions";
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

export function DeleteItemDialog({
  itemId,
  itemName,
  open,
  onOpenChange,
}: {
  itemId: string;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    const result = await deleteItem({ id: itemId });
    setDeleting(false);

    if (!result.ok) {
      setError("Couldn't delete. Please try again.");
      return;
    }

    onOpenChange(false);
    router.push("/dashboard/menu");
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item?</AlertDialogTitle>
          <AlertDialogDescription>
            {`Delete "${itemName}"? This can't be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleConfirm}>
            {deleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
