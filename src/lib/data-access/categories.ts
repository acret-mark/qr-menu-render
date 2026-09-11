import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type Category = typeof categories.$inferSelect;
export type NewCategory = { name: string; sortOrder?: number };

/** Owner-scoped (contracts/data-access-layer.md). Resolves the caller's own
 * business internally — never accepts a businessId argument that hasn't
 * been checked against ownerId. */
export async function getOwnCategories(ownerId: string): Promise<Category[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db.select().from(categories).where(eq(categories.businessId, business.id));
}

export async function createOwnCategory(
  ownerId: string,
  input: NewCategory
): Promise<Category | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [category] = await db
    .insert(categories)
    .values({ businessId: business.id, name: input.name, sortOrder: input.sortOrder ?? 0 })
    .returning();
  return category;
}

/** Returns null (not the row) if `categoryId` doesn't belong to the caller's
 * own business — the ownership check IS the query, not a separate step a
 * caller could forget. */
export async function getOwnCategoryById(
  ownerId: string,
  categoryId: string
): Promise<Category | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.businessId, business.id)))
    .limit(1);
  return category ?? null;
}

export async function updateOwnCategory(
  ownerId: string,
  categoryId: string,
  input: Partial<NewCategory>
): Promise<Category | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [category] = await db
    .update(categories)
    .set(input)
    .where(and(eq(categories.id, categoryId), eq(categories.businessId, business.id)))
    .returning();
  return category ?? null;
}
