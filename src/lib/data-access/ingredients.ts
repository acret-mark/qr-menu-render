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
