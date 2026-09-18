"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveItem } from "@/lib/items/actions";
import { syncItemIngredientsAction } from "@/lib/ingredients/actions";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemPhotoUploader } from "@/components/items/item-photo-uploader";
import { DeleteItemDialog } from "@/components/items/delete-item-dialog";
import { IngredientTagInput, type IngredientOption } from "@/components/items/ingredient-tag-input";
import {
  ItemDescriptionField,
  type ItemDescriptionFieldHandle,
} from "@/components/items/item-description-field";
import { Switch } from "@/components/ui/switch";
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
  descriptionSource?: "ai_generated" | "manual" | null;
  aiKeywords?: string[] | null;
};

function isPriceValid(value: string): boolean {
  if (value.trim() === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

export function ItemForm({
  categories,
  item,
  allIngredients = [],
  initialIngredients = [],
}: {
  categories: Category[];
  item?: ItemFormItem;
  allIngredients?: IngredientOption[];
  initialIngredients?: IngredientOption[];
}) {
  const router = useRouter();
  const isEdit = !!item;
  const descriptionFieldRef = useRef<ItemDescriptionFieldHandle>(null);

  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? categories[0]?.id ?? "");
  const [price, setPrice] = useState(item?.price ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [acceptedAiDraft, setAcceptedAiDraft] = useState<{ keywords: string[] } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(item?.photoUrl ?? null);
  const [isDisplayed, setIsDisplayed] = useState(item?.isDisplayed ?? true);
  const [isSoldOut, setIsSoldOut] = useState(item?.isSoldOut ?? false);
  const [isBestSeller, setIsBestSeller] = useState(item?.isBestSeller ?? false);
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>(allIngredients);
  const [ingredients, setIngredients] = useState<IngredientOption[]>(initialIngredients);

  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canSubmit =
    name.trim() !== "" && categoryId !== "" && isPriceValid(price) && !isPhotoUploading && !submitting;

  function handleDescriptionChange(next: string) {
    setDescription(next);
    setAcceptedAiDraft(null);
  }

  function handleAcceptedDraft(keywords: string[]) {
    setAcceptedAiDraft({ keywords });
  }

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
      acceptedAiDraft: acceptedAiDraft ?? undefined,
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
        "not-found": "Couldn't save. Please try again.",
        locked: "Your subscription has expired. Renew to keep editing your menu.",
      };
      setError(messages[result.reason] ?? "Couldn't save. Please try again.");
      return;
    }

    // specs/023-menu-item-ingredients: attaching/removing ingredients is
    // part of the same save action (spec Assumptions) — reconciled here,
    // right after the item itself is guaranteed to exist with a real id
    // (either the edited item's own id, or the id saveItem just created).
    await syncItemIngredientsAction(
      item?.id ?? result.id,
      ingredients.map((i) => i.id)
    );

    router.push("/dashboard/menu");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-4">
      <div className="flex justify-center">
        <ItemPhotoUploader
          photoUrl={photoUrl}
          onPhotoChange={setPhotoUrl}
          onUploadingChange={setIsPhotoUploading}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="item-name" className="text-sm font-medium">
          Item name
        </label>
        <input
          id="item-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => descriptionFieldRef.current?.triggerAutoDraft()}
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

      <ItemDescriptionField
        ref={descriptionFieldRef}
        itemId={item?.id}
        name={name}
        initialDescription={item?.description ?? ""}
        initialDescriptionSource={item?.descriptionSource ?? null}
        initialKeywords={item?.aiKeywords ?? null}
        onDescriptionChange={handleDescriptionChange}
        onAcceptedDraft={handleAcceptedDraft}
      />

      <IngredientTagInput
        allIngredients={ingredientOptions}
        onAllIngredientsChange={setIngredientOptions}
        selected={ingredients}
        onSelectedChange={setIngredients}
      />

      <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
        <div className="flex items-center justify-between px-3.5 py-3">
          <span className="text-sm font-medium">Best Seller</span>
          <Switch checked={isBestSeller} onCheckedChange={setIsBestSeller} ariaLabel="Best Seller" />
        </div>
        <div className="flex items-center justify-between px-3.5 py-3">
          <span className="text-sm font-medium">Available</span>
          <Switch
            checked={!isSoldOut}
            onCheckedChange={(checked) => setIsSoldOut(!checked)}
            ariaLabel="Available"
          />
        </div>
        <div className="flex items-center justify-between px-3.5 py-3">
          <span className="text-sm font-medium">Show on Menu</span>
          <Switch checked={isDisplayed} onCheckedChange={setIsDisplayed} ariaLabel="Show on Menu" />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={!canSubmit} className="mt-2 h-11 w-full">
        {submitting ? "Saving…" : "Save Item"}
      </Button>

      {isEdit && (
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="mb-4 flex items-center justify-center gap-1.5 text-sm font-medium text-destructive"
        >
          <Trash2 size={16} />
          Delete Item
        </button>
      )}

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
