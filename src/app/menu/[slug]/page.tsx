import { getPublicBusinessBySlug } from "@/lib/data-access/businesses";
import { getPublicCategoriesWithItems } from "@/lib/data-access/categories";
import {
  getPublicCategoryTranslations,
  getPublicItemTranslations,
} from "@/lib/data-access/translations";
import { getInitialDisplayLanguage, applyPublicTranslations } from "@/lib/menu/language";
import { MenuHeader } from "@/components/menu/menu-header";
import { CategoryTabs } from "@/components/menu/category-tabs";
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getPublicBusinessBySlug(slug);

  if (!business) {
    return <MenuNotAvailable />;
  }

  const categories = await getPublicCategoriesWithItems(business.id);

  const isPro = business.plan === "pro";
  let displayCategories = categories;
  let translationUnavailable = false;
  let selectedLanguage: string = business.sourceLanguage;

  if (isPro) {
    const language = await getInitialDisplayLanguage(business.sourceLanguage);
    selectedLanguage = language;

    if (language !== business.sourceLanguage) {
      const [categoryTranslations, itemTranslations] = await Promise.all([
        getPublicCategoryTranslations(business.id, language),
        getPublicItemTranslations(business.id, language),
      ]);

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
      <CategoryTabs categories={displayCategories} />
    </div>
  );
}
