import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  categoryTranslations,
  ingredientTranslations,
  itemTranslations,
  type displayLanguageEnum,
} from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type DisplayLanguage = (typeof displayLanguageEnum.enumValues)[number];

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

export async function upsertOwnCategoryTranslation(
  ownerId: string,
  input: {
    categoryId: string;
    languageCode: DisplayLanguage;
    translatedName: string | null;
    sourceHash: string;
  }
): Promise<CategoryTranslation | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [row] = await db
    .insert(categoryTranslations)
    .values({ businessId: business.id, ...input })
    .onConflictDoUpdate({
      target: [categoryTranslations.categoryId, categoryTranslations.languageCode],
      set: {
        translatedName: input.translatedName,
        sourceHash: input.sourceHash,
        translatedAt: new Date(),
      },
    })
    .returning();
  return row;
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
 * Public-scoped (contracts/data-access-layer.md category 3,
 * specs/007-public-menu-display's public-visibility-boundary contract):
 * `businessId` MUST already come from a non-null `getPublicBusinessBySlug`
 * result in the same request — this function does not re-check status.
 * Optional `language` filter added by specs/007 (backward-compatible —
 * existing callers omitting it are unaffected).
 */
export async function getPublicItemTranslations(
  businessId: string,
  language?: DisplayLanguage
): Promise<ItemTranslation[]> {
  return db
    .select()
    .from(itemTranslations)
    .where(
      language
        ? and(eq(itemTranslations.businessId, businessId), eq(itemTranslations.languageCode, language))
        : eq(itemTranslations.businessId, businessId)
    );
}

/**
 * Public-scoped — same trust chain as getPublicItemTranslations above.
 */
export async function getPublicCategoryTranslations(
  businessId: string,
  language?: DisplayLanguage
): Promise<CategoryTranslation[]> {
  return db
    .select()
    .from(categoryTranslations)
    .where(
      language
        ? and(
            eq(categoryTranslations.businessId, businessId),
            eq(categoryTranslations.languageCode, language)
          )
        : eq(categoryTranslations.businessId, businessId)
    );
}
