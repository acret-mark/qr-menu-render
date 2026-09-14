"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveItem } from "@/lib/items/actions";
import { Button } from "@/components/ui/button";
import { ItemPhotoUploader } from "@/components/items/item-photo-uploader";
import { DeleteItemDialog } from "@/components/items/delete-item-dialog";
import { cn } from "@/lib/utils";

type Category = { id: string; name: string };
type ItemFormItem = {
  id: string;
  name: string;
  categoryId: string;
  price: string;
  description: string | null;
  photoUrl: string | null;
  isDisplayed: boolean;
  isSoldOut: boolean;
  isBestSeller: boolean;
};

function isPriceValid(value: string): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function ItemForm({ categories, item }: { categories: Category[]; item?: ItemFormItem }) {
  const router = useRouter();
  const isEdit = !!item;

  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photoUrl ?? null);
  const [isDisplayed, setIsDisplayed] = useState(item?.isDisplayed ?? true);
  const [isSoldOut, setIsSoldOut] = useState(item?.isSoldOut ?? false);
  const [isBestSeller, setIsBestSeller] = useState(item?.isBestSeller ?? false);

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canSubmit =
    name.trim() !== "" && categoryId !== "" && isPriceValid(price) && !isPhotoUploading && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const result = await saveItem({
      id: item?.id,
      categoryId,
      name,
      description: description || undefined,
      photoUrl,
      price: Number(price),
      isDisplayed,
      isSoldOut,
      isBestSeller,
    });

    setSubmitting(false);

    if (!result.ok) {
      const messages: Record<string, string> = {
        "empty-name": "Name is required.",
        "missing-category": "Please choose a category.",
        "invalid-price": "Enter a valid price.",
        "invalid-category": "That category is no longer available — pick another.",
        "not-authenticated": "Your session expired — please sign in again.",
        "no-business": "No business found for this account.",
        "not-found": "Couldn't save — try again.",
      };
      setError(messages[result.reason] ?? "Couldn't save — try again.");
      return;
    }

    router.push("/dashboard/menu");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <ItemPhotoUploader
        photoUrl={photoUrl}
        onPhotoChange={setPhotoUrl}
        onUploadingChange={setIsPhotoUploading}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-name" className="text-sm font-medium">
          Item name
        </label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sizzling Sisig"
          className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-category" className="text-sm font-medium">
          Category
        </label>
        <select
          id="item-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-11 rounded-lg border border-border bg-background px-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-price" className="text-sm font-medium">
          Price
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            ₱
          </span>
          <input
            id="item-price"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className={cn(
              "h-11 w-full rounded-lg border border-border bg-background pl-7 pr-3.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              price !== "" && !isPriceValid(price) && "border-destructive"
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="item-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Optional — a short, appetizing description"
          className="rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <label className="flex items-center justify-between gap-4 text-sm font-medium">
          Best Seller
          <input
            type="checkbox"
            checked={isBestSeller}
            onChange={(e) => setIsBestSeller(e.target.checked)}
            className="size-4"
          />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm font-medium">
          Available
          <input
            type="checkbox"
            checked={!isSoldOut}
            onChange={(e) => setIsSoldOut(!e.target.checked)}
            className="size-4"
          />
        </label>
        <label className="flex items-center justify-between gap-4 text-sm font-medium">
          Show on Menu
          <input
            type="checkbox"
            checked={isDisplayed}
            onChange={(e) => setIsDisplayed(e.target.checked)}
            className="size-4"
          />
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={!canSubmit} className="h-11 flex-1">
          {submitting ? "Saving…" : "Save Item"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            size="lg"
            className="h-11"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </Button>
        )}
      </div>

      {isEdit && (
        <DeleteItemDialog
          itemId={item.id}
          itemName={item.name}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </form>
  );
}
