import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { items } from "@/lib/db/schema";
import { getOwnBusiness } from "./businesses";

export type Item = typeof items.$inferSelect;
export type NewItem = {
  categoryId: string;
  name: string;
  description?: string;
  photoUrl?: string;
  price: string;
};

export async function getOwnItems(ownerId: string): Promise<Item[]> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return [];
  return db.select().from(items).where(eq(items.businessId, business.id));
}

/** New items append to the end within their own category (matching
 * qr-menu-dev's `max(sort_order)+1` scoped to category_id, not
 * business-wide — specs/005-menu-items research.md Decision 2). */
export async function createOwnItem(ownerId: string, input: NewItem): Promise<Item | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [last] = await db
    .select({ sortOrder: items.sortOrder })
    .from(items)
    .where(and(eq(items.businessId, business.id), eq(items.categoryId, input.categoryId)))
    .orderBy(desc(items.sortOrder))
    .limit(1);
  const nextSortOrder = (last?.sortOrder ?? -1) + 1;

  const [item] = await db
    .insert(items)
    .values({
      businessId: business.id,
      categoryId: input.categoryId,
      name: input.name,
      description: input.description,
      photoUrl: input.photoUrl,
      price: input.price,
      sortOrder: nextSortOrder,
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
  input: Partial<Pick<NewItem, "categoryId" | "name" | "description" | "photoUrl" | "price">> & {
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

/** Returns false if the item doesn't belong to the caller's own business (or
 * the caller has no business) — the delete simply affects zero rows. */
export async function deleteOwnItem(ownerId: string, itemId: string): Promise<boolean> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return false;

  const deleted = await db
    .delete(items)
    .where(and(eq(items.id, itemId), eq(items.businessId, business.id)))
    .returning({ id: items.id });
  return deleted.length > 0;
}

/** Narrow, single-field fast path for the item list's inline Available
 * toggle (spec FR-020, SC-006) — deliberately separate from updateOwnItem
 * so a future change to the general edit-form save can never accidentally
 * slow down or complicate this one path that has to feel instant
 * (research.md Decision 1). */
export async function setOwnItemSoldOut(
  ownerId: string,
  itemId: string,
  isSoldOut: boolean
): Promise<Item | null> {
  const business = await getOwnBusiness(ownerId);
  if (!business) return null;

  const [item] = await db
    .update(items)
    .set({ isSoldOut })
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

/**
 * Admin-scoped (contracts/data-access-layer.md category 2, specs/018-
 * business-detail, research.md Decision 2). Deliberately unfiltered —
 * returns every item regardless of isDisplayed/isSoldOut, the opposite
 * filtering posture from getPublicDisplayedItems by design: diagnostic
 * oversight, not the customer-facing subset. No identity parameter,
 * trusted entirely by the caller having already verified isAdmin.
 */
export async function adminGetItemsForBusiness(businessId: string): Promise<Item[]> {
  return db.select().from(items).where(eq(items.businessId, businessId));
}
