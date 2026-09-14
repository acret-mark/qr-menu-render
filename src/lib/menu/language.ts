import { cookies, headers } from "next/headers";
import { displayLanguageEnum, type sourceLanguageEnum } from "@/lib/db/schema";
import type {
  CategoryTranslation,
  DisplayLanguage,
  ItemTranslation,
} from "@/lib/data-access/translations";

export const LANG_COOKIE_NAME = "hapag_lang";

type SourceLanguage = (typeof sourceLanguageEnum.enumValues)[number];

export function isDisplayLanguage(value: string): value is DisplayLanguage {
  return (displayLanguageEnum.enumValues as readonly string[]).includes(value);
}

function matchDisplayLanguage(tag: string): DisplayLanguage | null {
  const primary = tag.trim().split("-")[0].toLowerCase();
  return isDisplayLanguage(primary) ? primary : null;
}

/** Splits an Accept-Language header into tags sorted by descending q-weight. */
function parseAcceptLanguage(header: string): string[] {
  return header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      return { tag: tag.trim(), q: qPart ? Number(qPart) : 1 };
    })
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag);
}

function sourceLanguageFallback(sourceLanguage: SourceLanguage): {
  language: DisplayLanguage;
  skipTranslation: boolean;
} {
  if (isDisplayLanguage(sourceLanguage)) {
    return { language: sourceLanguage, skipTranslation: false };
  }
  // The business's own source language (e.g. "fil") isn't itself a display
  // language — "en" is used as a pure UI placeholder, no translation fetch
  // attempted (research.md Decision 4).
  return { language: "en", skipTranslation: true };
}

/**
 * Server-side language resolution, in precedence order: the hapag_lang
 * cookie (a prior manual choice) → the Accept-Language header → the
 * business's own source language. Ported logic (not code) from
 * qr-menu-dev's function of the same name — research.md Decision 4.
 */
export async function getInitialDisplayLanguage(
  sourceLanguage: SourceLanguage
): Promise<DisplayLanguage> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LANG_COOKIE_NAME)?.value;
  if (cookieValue && isDisplayLanguage(cookieValue)) {
    return cookieValue;
  }

  const headerList = await headers();
  const acceptLanguage = headerList.get("accept-language");
  if (acceptLanguage) {
    for (const tag of parseAcceptLanguage(acceptLanguage)) {
      const match = matchDisplayLanguage(tag);
      if (match) return match;
    }
  }

  return sourceLanguageFallback(sourceLanguage).language;
}

/**
 * The read-side translation fallback chain (data-model.md): translated
 * value if present, otherwise the source-language value — never a third
 * tier, never blank. Item NAME is never touched (copied through as-is),
 * matching qr-menu-dev's applyTranslations exactly.
 */
export function applyPublicTranslations<
  TCategory extends { id: string; name: string },
  TItem extends { id: string; categoryId: string; description: string | null },
>(
  categories: (TCategory & { items: TItem[] })[],
  categoryTranslations: CategoryTranslation[],
  itemTranslations: ItemTranslation[]
) {
  const categoryNameByCategoryId = new Map(
    categoryTranslations.map((row) => [row.categoryId, row.translatedName])
  );
  const descriptionByItemId = new Map(
    itemTranslations.map((row) => [row.itemId, row.translatedDescription])
  );

  return categories.map((category) => ({
    ...category,
    name: categoryNameByCategoryId.get(category.id) ?? category.name,
    items: category.items.map((item) => ({
      ...item,
      description: descriptionByItemId.get(item.id) ?? item.description,
    })),
  }));
}
