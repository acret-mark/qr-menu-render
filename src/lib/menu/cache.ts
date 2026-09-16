import { unstable_cache } from "next/cache";
import { getPublicBusinessBySlug } from "@/lib/data-access/businesses";
import { getPublicCategoriesWithItems } from "@/lib/data-access/categories";
import { getPublicItemIngredients } from "@/lib/data-access/ingredients";
import {
  getPublicCategoryTranslations,
  getPublicIngredientTranslations,
  getPublicItemTranslations,
  type DisplayLanguage,
} from "@/lib/data-access/translations";

/**
 * specs/026-menu-data-caching. `unstable_cache`-wrapped versions of every
 * public read `/menu/[slug]/page.tsx` uses — deliberately NOT `"use cache"`/
 * Cache Components (research.md Decision 1: that would be a project-wide
 * rendering-model migration, disproportionate to this one already-public
 * route's caching need). Every wrapper is tagged `menu:{slug}` (research.md
 * Decision 2 — one tag per business, not per content type) with a 60s
 * `revalidate` safety net alongside active invalidation (research.md
 * Decision 3). `slug` (not `businessId`) is the cache key, since it's the
 * one identity these reads actually vary by from the outside — the
 * wrapped functions still take `businessId` to run the real query
 * unchanged.
 */
const REVALIDATE_SECONDS = 60;

export function getCachedPublicBusinessBySlug(slug: string) {
  return unstable_cache(() => getPublicBusinessBySlug(slug), ["public-business", slug], {
    tags: [`menu:${slug}`],
    revalidate: REVALIDATE_SECONDS,
  })();
}

export function getCachedPublicCategoriesWithItems(slug: string, businessId: string) {
  return unstable_cache(
    () => getPublicCategoriesWithItems(businessId),
    ["public-categories-with-items", slug],
    { tags: [`menu:${slug}`], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getCachedPublicItemIngredients(slug: string, businessId: string) {
  return unstable_cache(
    () => getPublicItemIngredients(businessId),
    ["public-item-ingredients", slug],
    { tags: [`menu:${slug}`], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getCachedPublicCategoryTranslations(
  slug: string,
  businessId: string,
  language: DisplayLanguage
) {
  return unstable_cache(
    () => getPublicCategoryTranslations(businessId, language),
    ["public-category-translations", slug, language],
    { tags: [`menu:${slug}`], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getCachedPublicItemTranslations(
  slug: string,
  businessId: string,
  language: DisplayLanguage
) {
  return unstable_cache(
    () => getPublicItemTranslations(businessId, language),
    ["public-item-translations", slug, language],
    { tags: [`menu:${slug}`], revalidate: REVALIDATE_SECONDS }
  )();
}

export function getCachedPublicIngredientTranslations(
  slug: string,
  businessId: string,
  language: DisplayLanguage
) {
  return unstable_cache(
    () => getPublicIngredientTranslations(businessId, language),
    ["public-ingredient-translations", slug, language],
    { tags: [`menu:${slug}`], revalidate: REVALIDATE_SECONDS }
  )();
}
