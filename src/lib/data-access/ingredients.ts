import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { ingredients, itemIngredients } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type Ingredient = typeof ingredients.$inferSelect;

export async function getOwnIngredients(ownerId: string): Promise<Ingredient[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db.select().from(ingredients).where(eq(ingredients.businessId, business.id));
}

export async function createOwnIngredient(
  ownerId: string,
  name: string
): Promise<Ingredient | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [ingredient] = await db
    .insert(ingredients)
    .values({ businessId: business.id, name })
    .returning();
  return ingredient;
}

export async function getOwnItemIngredients(ownerId: string, itemId: string) {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db
    .select()
    .from(itemIngredients)
    .where(and(eq(itemIngredients.itemId, itemId), eq(itemIngredients.businessId, business.id)));
}

export async function addOwnItemIngredient(
  ownerId: string,
  itemId: string,
  ingredientId: string
): Promise<boolean> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return false;

  await db.insert(itemIngredients).values({ itemId, ingredientId, businessId: business.id });
  return true;
}

export type PublicItemIngredient = { itemId: string; ingredientId: string; name: string };

/**
 * Public-scoped (specs/008-search-item-detail's public-ingredients-boundary
 * contract, extending specs/007's public-visibility-boundary.md). `businessId`
 * MUST already come from a non-null `getPublicBusinessBySlug` result in the
 * same request — this function does not re-check status itself. Returns
 * every ingredient row across the business's items in one query; the caller
 * groups by itemId. An item with no ingredients simply contributes no rows —
 * never an error.
 */
export async function getPublicItemIngredients(
  businessId: string
): Promise<PublicItemIngredient[]> {
  const rows = await db
    .select({
      itemId: itemIngredients.itemId,
      ingredientId: ingredients.id,
      name: ingredients.name,
    })
    .from(itemIngredients)
    .innerJoin(ingredients, eq(ingredients.id, itemIngredients.ingredientId))
    .where(eq(itemIngredients.businessId, businessId));
  return rows;
}
