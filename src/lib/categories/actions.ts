"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import {
  createOwnCategory,
  deleteOwnCategory,
  reorderOwnCategory,
  updateOwnCategory,
} from "@/lib/data-access/categories";
import { getOwnBusiness } from "@/lib/data-access/businesses";
import {
  getOwnCategoryTranslations,
  upsertOwnCategoryTranslation,
} from "@/lib/data-access/translations";
import { translateText } from "@/lib/deepl/client";
import { sha256Hex } from "@/lib/hash";
import { getRequiredDisplayLanguages } from "@/lib/categories/translation-status";

export type SaveCategoryResult =
  | { ok: true; hasStaleTranslation: boolean }
  | { ok: false; reason: "empty-name" | "not-authenticated" | "no-business" | "not-found" };

/**
 * Create or update a category, then translate-on-save (spec FR-011–FR-013):
 * every display language except the business's own source language, skipped
 * when its stored translation's source_hash already matches the current
 * name (FR-012). Awaits every translation attempt (success or failure)
 * before returning (FR-011a) — a failed language never blocks the save.
 */
export async function saveCategory(input: {
  id?: string;
  name: string;
}): Promise<SaveCategoryResult> {
  const user = await requireUser();

  const name = input.name.trim();
  if (!name) return { ok: false, reason: "empty-name" };

  const business = await getOwnBusiness(user.id);
  if (!business) return { ok: false, reason: "no-business" };

  const category = input.id
    ? await updateOwnCategory(user.id, input.id, { name })
    : await createOwnCategory(user.id, { name });
  if (!category) return { ok: false, reason: "not-found" };

  const requiredLanguages = getRequiredDisplayLanguages(business.sourceLanguage);
  const currentHash = sha256Hex(name);

  const existingTranslations = await getOwnCategoryTranslations(user.id);
  const existingByLanguage = new Map(
    existingTranslations
      .filter((row) => row.categoryId === category.id)
      .map((row) => [row.languageCode, row])
  );

  const staleLanguages = requiredLanguages.filter(
    (language) => existingByLanguage.get(language)?.sourceHash !== currentHash
  );

  const results = await Promise.allSettled(
    staleLanguages.map(async (language) => {
      const result = await translateText(name, language);
      if (result.ok) {
        await upsertOwnCategoryTranslation(user.id, {
          categoryId: category.id,
          languageCode: language,
          translatedName: result.text,
          sourceHash: currentHash,
        });
      }
      return { language, ok: result.ok };
    })
  );

  const translatedNow = new Set(
    results.flatMap((r) => (r.status === "fulfilled" && r.value.ok ? [r.value.language] : []))
  );

  const hasStaleTranslation = requiredLanguages.some((language) => {
    if (translatedNow.has(language)) return false;
    return existingByLanguage.get(language)?.sourceHash !== currentHash;
  });

  revalidatePath("/categories");
  return { ok: true, hasStaleTranslation };
}

export type DeleteCategoryResult = { ok: boolean };

export async function deleteCategory(input: { id: string }): Promise<DeleteCategoryResult> {
  const user = await requireUser();
  const ok = await deleteOwnCategory(user.id, input.id);
  revalidatePath("/categories");
  return { ok };
}

export type ReorderCategoryResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "boundary" };

export async function reorderCategory(input: {
  id: string;
  direction: "up" | "down";
}): Promise<ReorderCategoryResult> {
  const user = await requireUser();
  const result = await reorderOwnCategory(user.id, input.id, input.direction);
  if (result.ok) revalidatePath("/categories");
  return result;
}
