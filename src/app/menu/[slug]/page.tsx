import type { getPublicIngredientTranslations } from "@/lib/data-access/translations";
import {
  getCachedPublicBusinessBySlug,
  getCachedPublicCategoriesWithItems,
  getCachedPublicCategoryTranslations,
  getCachedPublicIngredientTranslations,
  getCachedPublicItemIngredients,
  getCachedPublicItemTranslations,
} from "@/lib/menu/cache";
import {
  applyIngredientTranslations,
  applyPublicTranslations,
  getInitialDisplayLanguage,
} from "@/lib/menu/language";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSearch } from "@/components/menu/menu-search";
import { LanguageSelector } from "@/components/menu/language-selector";
import { TranslationUnavailableBanner } from "@/components/menu/translation-unavailable-banner";
import { MenuNotAvailable } from "@/components/menu/menu-not-available";
import { FooterRegistrationCta } from "@/components/menu/footer-registration-cta";
import { OfflineIndicator } from "@/components/menu/offline-indicator";
import type { Metadata } from "next";

// specs/033-search-engine-indexing-control FR-006/research.md Decision 5: a
// plain static export, not generateMetadata — this route has no existing
// dynamic metadata to merge with, and a static export structurally
// guarantees no per-business title/description is ever added here (FR-012).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Public menu display (specs/007-public-menu-display) — the first
// unauthenticated, customer-facing page in the project. getPublicBusinessBySlug
// is the ONE place visibility (status IN ('active','trial')) is checked
// (contracts/public-visibility-boundary.md) — every other call below only
// ever runs after that check has already succeeded. specs/026-menu-data-
// caching: every read below goes through cache.ts's unstable_cache
// wrappers instead of the raw data-access functions directly — same
// results, same call order, just reused across repeat/concurrent requests
// until an owner/admin edit calls updateTag(`menu:${slug}`).
export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cat?: string; q?: string; item?: string }>;
}) {
  const { slug } = await params;
  const { cat: initialCategoryIndex, q: initialQuery, item: initialItemIndex } =
    await searchParams;
  const business = await getCachedPublicBusinessBySlug(slug);

  if (!business) {
    return <MenuNotAvailable slug={slug} />;
  }

  const [categories, itemIngredientRows] = await Promise.all([
    getCachedPublicCategoriesWithItems(slug, business.id),
    getCachedPublicItemIngredients(slug, business.id),
  ]);

  const isPro = business.plan === "pro";
  let displayCategories = categories;
  let translationUnavailable = false;
  let selectedLanguage: string = business.sourceLanguage;
  let ingredientTranslations: Awaited<ReturnType<typeof getPublicIngredientTranslations>> = [];

  if (isPro) {
    const language = await getInitialDisplayLanguage(business.sourceLanguage);
    selectedLanguage = language;

    if (language !== business.sourceLanguage) {
      const [categoryTranslations, itemTranslations, fetchedIngredientTranslations] =
        await Promise.all([
          getCachedPublicCategoryTranslations(slug, business.id, language),
          getCachedPublicItemTranslations(slug, business.id, language),
          getCachedPublicIngredientTranslations(slug, business.id, language),
        ]);
      ingredientTranslations = fetchedIngredientTranslations;

      // FR-014: the whole selected language came back empty (not just one
      // missing field) — distinct from FR-012's silent per-field fallback.
      translationUnavailable =
        categoryTranslations.length === 0 &&
        itemTranslations.length === 0 &&
        categories.length > 0;

      displayCategories = applyPublicTranslations(
        categories,
        categoryTranslations,
        itemTranslations
      );
    }
  }

  // Group ingredient rows by item, translated ?? source per name (spec 008
  // FR-017) — attached after category/item translation so every item on
  // every path (Pro or Standard, translated or not) ends up with its final
  // ingredient list.
  const ingredientsByItemId = new Map<string, { id: string; name: string }[]>();
  for (const row of itemIngredientRows) {
    const list = ingredientsByItemId.get(row.itemId) ?? [];
    list.push({ id: row.ingredientId, name: row.name });
    ingredientsByItemId.set(row.itemId, list);
  }
  displayCategories = displayCategories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({
      ...item,
      ingredients: applyIngredientTranslations(
        ingredientsByItemId.get(item.id) ?? [],
        ingredientTranslations
      ),
    })),
  }));

  return (
    // `relative` is load-bearing: ItemDetailSheet (rendered inside
    // MenuSearch below) positions itself `absolute inset-0` against the
    // nearest positioned ancestor, which is deliberately this shell — not
    // MenuSearch's own wrapper — so the sheet's dimmed backdrop covers the
    // hero/identity card too, matching qr-menu-dev's menu-home.tsx (the
    // whole app, not just the scrolling item list, dims behind the sheet).
    // `h-dvh` + `overflow-hidden` (replacing the old `min-h-screen`) makes
    // this a true mobile-app-shell frame: MenuSearch's own flex-1 min-h-0
    // region is what scrolls, everything else here stays fixed in place.
    <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-background">
      <OfflineIndicator />
      <MenuHeader
        name={business.name}
        address={business.address}
        logoUrl={business.logoUrl}
        languageSelector={
          isPro ? <LanguageSelector currentLanguage={selectedLanguage} /> : undefined
        }
      />
      {translationUnavailable && <TranslationUnavailableBanner />}
      <MenuSearch
        categories={displayCategories}
        initialCategoryIndex={initialCategoryIndex}
        initialQuery={initialQuery}
        initialItemIndex={initialItemIndex}
      />
      {business.plan === "standard" && <FooterRegistrationCta />}
    </div>
  );
}
