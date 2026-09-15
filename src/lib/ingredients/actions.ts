"use server";

import { requireUser } from "@/lib/auth/session";
import {
  addOwnItemIngredient,
  createOwnIngredient,
  getOwnIngredients,
  getOwnItemIngredients,
  removeOwnItemIngredient,
  type Ingredient,
} from "@/lib/data-access/ingredients";

const POSTGRES_UNIQUE_VIOLATION = "23505";

export type CreateIngredientResult =
  | { ok: true; ingredient: Ingredient }
  | { ok: false; reason: "empty-name" | "no-business" };

/**
 * specs/023-menu-item-ingredients FR-003/FR-007/FR-008. Creates immediately
 * (not deferred to item save) so the new ingredient is real and reusable
 * as soon as the owner confirms it — `createOwnIngredient` already scopes
 * via `getOwnBusiness(ownerId)` and relies on `ingredients`'s existing
 * case-insensitive unique index (specs/005) to reuse rather than
 * near-duplicate an existing entry (FR-005).
 *
 * FR-005's UI-level half (`IngredientTagInput`'s own exact-match check)
 * means the normal path never reaches the database with a name that's
 * already there — but a rare race (two tabs, or a direct call bypassing
 * the UI) still could. Rather than let that surface as an unhandled 500,
 * a unique-violation is caught and resolved by looking up and returning
 * the row that already won, so the caller still gets a real ingredient to
 * attach either way.
 */
export async function createIngredientAction(name: string): Promise<CreateIngredientResult> {
  const user = await requireUser();

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, reason: "empty-name" };

  try {
    const ingredient = await createOwnIngredient(user.id, trimmed);
    if (!ingredient) return { ok: false, reason: "no-business" };
    return { ok: true, ingredient };
  } catch (err) {
    // Drizzle wraps the underlying pg error in `.cause` — the Postgres
    // error code lives there, not on the thrown error itself (confirmed
    // directly against a real duplicate-key violation, not assumed).
    const cause = err instanceof Error ? (err.cause as { code?: string } | undefined) : undefined;
    if (cause?.code !== POSTGRES_UNIQUE_VIOLATION) throw err;

    const existing = (await getOwnIngredients(user.id)).find(
      (i) => i.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (!existing) throw err; // shouldn't happen — the violation implies a match exists
    return { ok: true, ingredient: existing };
  }
}

export type SyncItemIngredientsResult = { ok: true };

/**
 * specs/023-menu-item-ingredients spec Assumptions ("attaching/removing
 * ingredients is part of the same item save action — no separate save
 * step"). Called once, right after a successful saveItem, with the item's
 * final desired ingredient id list — diffs it against what's currently
 * attached and issues only the adds/removes actually needed. Both
 * addOwnItemIngredient/removeOwnItemIngredient already enforce the owner's
 * own business (FR-008), so a tampered ingredientId simply fails to attach
 * (FK constraint) or matches zero rows to remove.
 */
export async function syncItemIngredientsAction(
  itemId: string,
  ingredientIds: string[]
): Promise<SyncItemIngredientsResult> {
  const user = await requireUser();

  const current = await getOwnItemIngredients(user.id, itemId);
  const currentIds = new Set(current.map((row) => row.ingredientId));
  const desiredIds = new Set(ingredientIds);

  const toAdd = ingredientIds.filter((id) => !currentIds.has(id));
  const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));

  await Promise.all([
    ...toAdd.map((id) => addOwnItemIngredient(user.id, itemId, id)),
    ...toRemove.map((id) => removeOwnItemIngredient(user.id, itemId, id)),
  ]);

  return { ok: true };
}
