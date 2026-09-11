import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type Item = typeof items.$inferSelect;
export type NewItem = {
  categoryId: string;
  name: string;
  description?: string;
  price: string;
};

export async function getOwnItems(ownerId: string): Promise<Item[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db.select().from(items).where(eq(items.businessId, business.id));
}

export async function createOwnItem(ownerId: string, input: NewItem): Promise<Item | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [item] = await db
    .insert(items)
    .values({
      businessId: business.id,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      price: input.price,
    })
    .returning();
  return item;
}

export async function getOwnItemById(ownerId: string, itemId: string): Promise<Item | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [item] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.businessId, business.id)))
    .limit(1);
  return item ?? null;
}

export async function updateOwnItem(
  ownerId: string,
  itemId: string,
  input: Partial<Pick<NewItem, "name" | "description" | "price">> & {
    isDisplayed?: boolean;
    isSoldOut?: boolean;
    isBestSeller?: boolean;
  }
): Promise<Item | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [item] = await db
    .update(items)
    .set(input)
    .where(and(eq(items.id, itemId), eq(items.businessId, business.id)))
    .returning();
  return item ?? null;
}

/**
 * Public-scoped (contracts/data-access-layer.md category 3): no identity
 * parameter, filters only on displayed items belonging to a visible
 * business. Business-visibility filtering itself belongs to the caller
 * (join against businesses.status) — left minimal here since the public
 * menu page is out of this feature's scope (a later product-feature spec).
 */
export async function getPublicDisplayedItems(businessId: string): Promise<Item[]> {
  return db
    .select()
    .from(items)
    .where(and(eq(items.businessId, businessId), eq(items.isDisplayed, true)));
}
