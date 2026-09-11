import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  categoryTranslations,
  ingredientTranslations,
  itemTranslations,
  type displayLanguageEnum,
} from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

type DisplayLanguage = (typeof displayLanguageEnum.enumValues)[number];

export type ItemTranslation = typeof itemTranslations.$inferSelect;
export type CategoryTranslation = typeof categoryTranslations.$inferSelect;
export type IngredientTranslation = typeof ingredientTranslations.$inferSelect;

// One module for all three translation tables (item/category/ingredient) —
// they share the same owner-scoped shape (contracts/data-access-layer.md),
// so splitting into three near-identical files would just be repetition.

export async function getOwnItemTranslations(ownerId: string): Promise<ItemTranslation[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db
    .select()
    .from(itemTranslations)
    .where(eq(itemTranslations.businessId, business.id));
}

export async function upsertOwnItemTranslation(
  ownerId: string,
  input: {
    itemId: string;
    languageCode: DisplayLanguage;
    translatedDescription: string | null;
    sourceHash: string;
  }
): Promise<ItemTranslation | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [row] = await db
    .insert(itemTranslations)
    .values({ businessId: business.id, ...input })
    .onConflictDoUpdate({
      target: [itemTranslations.itemId, itemTranslations.languageCode],
      set: {
        translatedDescription: input.translatedDescription,
        sourceHash: input.sourceHash,
        translatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

export async function getOwnCategoryTranslations(ownerId: string): Promise<CategoryTranslation[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db
    .select()
    .from(categoryTranslations)
    .where(eq(categoryTranslations.businessId, business.id));
}

export async function getOwnIngredientTranslations(
  ownerId: string
): Promise<IngredientTranslation[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db
    .select()
    .from(ingredientTranslations)
    .where(eq(ingredientTranslations.businessId, business.id));
}

/**
 * Public-scoped: no identity, filters only on business_id — the caller
 * (a later, out-of-scope public-menu feature) is responsible for having
 * already confirmed the business is visible (active/trial).
 */
export async function getPublicItemTranslations(businessId: string): Promise<ItemTranslation[]> {
  return db
    .select()
    .from(itemTranslations)
    .where(and(eq(itemTranslations.businessId, businessId)));
}
