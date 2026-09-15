import { getPublicBusinessBySlug } from "@/lib/data-access/businesses";
import { getPublicCategoriesWithItems } from "@/lib/data-access/categories";
import { getPublicItemIngredients } from "@/lib/data-access/ingredients";
import {
  getPublicCategoryTranslations,
  getPublicIngredientTranslations,
  getPublicItemTranslations,
} from "@/lib/data-access/translations";
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

// Public menu display (specs/007-public-menu-display) — the first
// unauthenticated, customer-facing page in the project. getPublicBusinessBySlug
// is the ONE place visibility (status IN ('active','trial')) is checked
// (contracts/public-visibility-boundary.md) — every other call below only
// ever runs after that check has already succeeded.
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
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    return <MenuNotAvailable slug={slug} />;
  }

  const [categories, itemIngredientRows] = await Promise.all([
    getPublicCategoriesWithItems(business.id),
    getPublicItemIngredients(business.id),
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
          getPublicCategoryTranslations(business.id, language),
          getPublicItemTranslations(business.id, language),
          getPublicIngredientTranslations(business.id, language),
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
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">
      <MenuHeader
        name={business.name}
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
    </div>
  );
}
