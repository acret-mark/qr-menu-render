import { displayLanguageEnum, type sourceLanguageEnum } from "@/lib/db/schema";
import { sha256Hex } from "@/lib/hash";

type SourceLanguage = (typeof sourceLanguageEnum.enumValues)[number];

/** Every display language a business needs a translation for — all of them
 * except whichever one matches its own source language (that language uses
 * the saved name directly, per spec 004's FR-011). Shared by the save path
 * (actions.ts) and the read path (page.tsx) so they can never disagree. */
export function getRequiredDisplayLanguages(sourceLanguage: SourceLanguage) {
  return displayLanguageEnum.enumValues.filter((language) => language !== sourceLanguage);
}

/** True when at least one required display language lacks a translation
 * row whose source_hash matches the category's current name — i.e. a
 * DeepL call failed (this save or a prior one) and hasn't been retried
 * yet (spec FR-013a). */
export function hasStaleTranslation(
  categoryName: string,
  sourceLanguage: SourceLanguage,
  translationsForCategory: { languageCode: string; sourceHash: string }[]
): boolean {
  const currentHash = sha256Hex(categoryName.trim());
  const byLanguage = new Map(translationsForCategory.map((row) => [row.languageCode, row]));
  return getRequiredDisplayLanguages(sourceLanguage).some(
    (language) => byLanguage.get(language)?.sourceHash !== currentHash
  );
}
