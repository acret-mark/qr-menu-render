"use server";

import { revalidatePath, updateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { requireEditAccess } from "@/lib/auth/edit-access";
import {
  createOwnItem,
  deleteOwnItem,
  getOwnItemById,
  setOwnItemSoldOut,
  updateOwnItem,
} from "@/lib/data-access/items";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import { getOwnCategoryById } from "@/lib/data-access/categories";
import { getOwnItemTranslations, upsertOwnItemTranslation } from "@/lib/data-access/translations";
import { translateText } from "@/lib/deepl/client";
import { validateImageFile } from "@/lib/uploads/image-validation";
import { uploadImage } from "@/lib/cloudinary/client";
import { sha256Hex } from "@/lib/hash";
import { getRequiredDisplayLanguages } from "@/lib/categories/translation-status";
import { db } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import { generateDescription } from "@/lib/items/ai-description-client";
import { checkAndIncrementDailyLimit } from "@/lib/items/ai-description-rate-limit";

function isValidPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 0 && Math.round(price * 100) === price * 100;
}

export type SaveItemResult =
  | { ok: true; id: string }
  | {
      ok: false;
      reason:
        | "empty-name"
        | "missing-category"
        | "invalid-price"
        | "invalid-category"
        | "not-authenticated"
        | "no-business"
        | "not-found"
        | "locked";
    };

/**
 * Create or update an item, then translate-on-save its description (spec
 * FR-023–FR-025a) — same pattern as specs/004's saveCategory, reused
 * against item_translations instead of category_translations. The item's
 * name is never translated (FR-026).
 */
export async function saveItem(input: {
  id?: string;
  categoryId: string;
  name: string;
  description?: string;
  photoUrl?: string | null;
  price: number;
  isDisplayed?: boolean;
  isSoldOut?: boolean;
  isBestSeller?: boolean;
  // Set when the caller just accepted an AI-generated draft for this save
  // (item-description-field.tsx) — records provenance on the item row so a
  // later edit can tell an AI-drafted description apart from a hand-written
  // one (the "AI-drafted" badge).
  acceptedAiDraft?: { keywords: string[] };
}): Promise<SaveItemResult> {
  const user = await requireUser();

  const name = input.name.trim();
  if (!name) return { ok: false, reason: "empty-name" };
  if (!input.categoryId) return { ok: false, reason: "missing-category" };
  if (!isValidPrice(input.price)) return { ok: false, reason: "invalid-price" };

  // specs/020-unified-subscription-lifecycle FR-012: server-side half of
  // the read-only lock — rejects even a direct call bypassing the UI.
  const editAccess = await requireEditAccess(user.id);
  if (!editAccess.ok) return { ok: false, reason: "locked" };

  const business = await getOwnBusiness(user.id);
  if (!business) return { ok: false, reason: "no-business" };

  // FR-008: re-validate the submitted category actually belongs to the
  // caller's own business — never trust a client-supplied categoryId alone,
  // matching qr-menu-dev's own defense-in-depth re-check.
  const category = await getOwnCategoryById(user.id, input.categoryId);
  if (!category) return { ok: false, reason: "invalid-category" };

  const description = input.description?.trim() || undefined;

  // specs/items AI description provenance (qr-menu-dev parity): an accepted
  // AI draft is tagged "ai_generated" with its keywords; any other change to
  // the description text is tagged "manual" — an unrelated field-only save
  // (price, photo, etc.) leaves the existing provenance untouched.
  const existingItem = input.id ? await getOwnItemById(user.id, input.id) : null;
  if (input.id && !existingItem) return { ok: false, reason: "not-found" };

  const hasManualDescriptionChange = existingItem
    ? (existingItem.description ?? "").trim() !== (description ?? "")
    : !!description;

  const provenanceFields: Partial<{
    descriptionSource: "ai_generated" | "manual";
    aiKeywords: string[];
    aiGeneratedAt: Date;
  }> = input.acceptedAiDraft
    ? {
        descriptionSource: "ai_generated",
        aiKeywords: input.acceptedAiDraft.keywords,
        aiGeneratedAt: new Date(),
      }
    : hasManualDescriptionChange
      ? { descriptionSource: "manual" }
      : {};

  const fields = {
    categoryId: input.categoryId,
    name,
    description,
    photoUrl: input.photoUrl ?? undefined,
    price: input.price.toFixed(2),
    ...(input.isDisplayed !== undefined && { isDisplayed: input.isDisplayed }),
    ...(input.isSoldOut !== undefined && { isSoldOut: input.isSoldOut }),
    ...(input.isBestSeller !== undefined && { isBestSeller: input.isBestSeller }),
  };

  const item = input.id
    ? await updateOwnItem(user.id, input.id, fields)
    : await createOwnItem(user.id, fields);
  if (!item) return { ok: false, reason: "not-found" };

  if (Object.keys(provenanceFields).length > 0) {
    await db.update(items).set(provenanceFields).where(eq(items.id, item.id));
  }

  if (description) {
    const requiredLanguages = getRequiredDisplayLanguages(business.sourceLanguage);
    const currentHash = sha256Hex(description);

    const existingTranslations = await getOwnItemTranslations(user.id);
    const existingByLanguage = new Map(
      existingTranslations
        .filter((row) => row.itemId === item.id)
        .map((row) => [row.languageCode, row])
    );

    const staleLanguages = requiredLanguages.filter(
      (language) => existingByLanguage.get(language)?.sourceHash !== currentHash
    );

    await Promise.allSettled(
      staleLanguages.map(async (language) => {
        const result = await translateText(description, language);
        if (result.ok) {
          await upsertOwnItemTranslation(user.id, {
            itemId: item.id,
            languageCode: language,
            translatedDescription: result.text,
            sourceHash: currentHash,
          });
        }
      })
    );
  }

  revalidatePath("/dashboard/menu");
  // specs/026-menu-data-caching FR-003/FR-004: an item create/update
  // (including price/description/photo/sold-out/display toggles) affects
  // the public menu's content.
  updateTag(`menu:${business.slug}`);
  return { ok: true, id: item.id };
}

export type DeleteItemResult = { ok: boolean };

export async function deleteItem(input: { id: string }): Promise<DeleteItemResult> {
  const user = await requireUser();

  const editAccess = await requireEditAccess(user.id);
  if (!editAccess.ok) return { ok: false };

  const business = await getOwnBusiness(user.id);

  const ok = await deleteOwnItem(user.id, input.id);
  revalidatePath("/dashboard/menu");
  if (ok && business) updateTag(`menu:${business.slug}`);
  return { ok };
}

export type SetItemSoldOutResult = { ok: boolean };

export async function setItemSoldOut(input: {
  id: string;
  isSoldOut: boolean;
}): Promise<SetItemSoldOutResult> {
  const user = await requireUser();

  const editAccess = await requireEditAccess(user.id);
  if (!editAccess.ok) return { ok: false };

  const business = await getOwnBusiness(user.id);

  const item = await setOwnItemSoldOut(user.id, input.id, input.isSoldOut);
  if (item) {
    revalidatePath("/dashboard/menu");
    if (business) updateTag(`menu:${business.slug}`);
  }
  return { ok: !!item };
}

export type UploadItemPhotoResult = { ok: true; photoUrl: string } | { ok: false; message: string };

export async function uploadItemPhoto(formData: FormData): Promise<UploadItemPhotoResult> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, message: "No file provided." };
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const photoUrl = await uploadImage(file, { folder: "items" });
    return { ok: true, photoUrl };
  } catch (error) {
    console.error("uploadItemPhoto: upload failed", error);
    return { ok: false, message: "The upload failed. Please try again." };
  }
}

export type GenerateItemDescriptionInput = {
  itemId?: string;
  name: string;
  keywords?: string;
};

export type GenerateItemDescriptionResult =
  | { ok: true; text: string }
  | { ok: false; reason: "limit-reached" }
  | { ok: false; reason: "generation-failed" };

/**
 * Ported from qr-menu-dev's generateItemDescription (src/lib/items/actions.ts)
 * — same Gemini-primary/Claude-Haiku-fallback generation and per-item daily
 * cap, adapted to render's own requireUser/requireEditAccess auth
 * conventions instead of qr-menu-dev's Supabase session + getSubscriptionAccess
 * check.
 */
export async function generateItemDescription(
  input: GenerateItemDescriptionInput
): Promise<GenerateItemDescriptionResult> {
  const user = await requireUser();

  const editAccess = await requireEditAccess(user.id);
  if (!editAccess.ok) return { ok: false, reason: "generation-failed" };

  const business = await getOwnBusiness(user.id);
  if (!business) return { ok: false, reason: "generation-failed" };

  if (input.itemId) {
    const { allowed } = await checkAndIncrementDailyLimit(input.itemId, business.id);
    if (!allowed) return { ok: false, reason: "limit-reached" };
  }

  const result = await generateDescription(input.name, input.keywords);
  if (!result.ok) return { ok: false, reason: "generation-failed" };

  return { ok: true, text: result.text };
}
