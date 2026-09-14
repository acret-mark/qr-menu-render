import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type Category = typeof categories.$inferSelect;
export type NewCategory = { name: string };

/** Owner-scoped (contracts/data-access-layer.md). Resolves the caller's own
 * business internally — never accepts a businessId argument that hasn't
 * been checked against ownerId. */
export async function getOwnCategories(ownerId: string): Promise<Category[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db.select().from(categories).where(eq(categories.businessId, business.id));
}

/** New categories always append to the end (matching qr-menu-dev's
 * `max(sort_order)+1` behavior) — sort_order is never caller-supplied on
 * create; it's only ever changed via reorderOwnCategory below. */
export async function createOwnCategory(
  ownerId: string,
  input: NewCategory
): Promise<Category | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [last] = await db
    .select({ sortOrder: categories.sortOrder })
    .from(categories)
    .where(eq(categories.businessId, business.id))
    .orderBy(desc(categories.sortOrder))
    .limit(1);
  const nextSortOrder = (last?.sortOrder ?? -1) + 1;

  const [category] = await db
    .insert(categories)
    .values({ businessId: business.id, name: input.name, sortOrder: nextSortOrder })
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

/** Returns false if the category doesn't belong to the caller's own business
 * (or the caller has no business) — the delete simply affects zero rows. */
export async function deleteOwnCategory(ownerId: string, categoryId: string): Promise<boolean> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return false;

  const deleted = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.businessId, business.id)))
    .returning({ id: categories.id });
  return deleted.length > 0;
}

export type ReorderResult = { ok: true } | { ok: false; reason: "not-found" | "boundary" };

/** Adjacent-swap reorder only (specs/004-category-manager FR-007) — never a
 * full resequence. Loads the caller's categories ordered by sort_order,
 * locates the target, and swaps sort_order with its immediate neighbor. */
export async function reorderOwnCategory(
  ownerId: string,
  categoryId: string,
  direction: "up" | "down"
): Promise<ReorderResult> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return { ok: false, reason: "not-found" };

  const ordered = await db
    .select()
    .from(categories)
    .where(eq(categories.businessId, business.id))
    .orderBy(categories.sortOrder);

  const index = ordered.findIndex((category) => category.id === categoryId);
  if (index === -1) return { ok: false, reason: "not-found" };

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= ordered.length) {
    return { ok: false, reason: "boundary" };
  }

  const current = ordered[index];
  const neighbor = ordered[neighborIndex];

  await Promise.all([
    db
      .update(categories)
      .set({ sortOrder: neighbor.sortOrder })
      .where(eq(categories.id, current.id)),
    db
      .update(categories)
      .set({ sortOrder: current.sortOrder })
      .where(eq(categories.id, neighbor.id)),
  ]);

  return { ok: true };
}
