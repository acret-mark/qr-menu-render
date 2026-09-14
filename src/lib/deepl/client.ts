import type { displayLanguageEnum } from "@/lib/db/schema";

// Ported unchanged from qr-menu-dev/src/lib/deepl/client.ts (Constitution
// Principle VI) — specs/004-category-manager is the first feature that
// needs it here. Only change from the source: `DisplayLanguage` doesn't
// come from a `src/lib/menu/` module (that's a not-yet-built feature here)
// — it's derived from this project's own schema enum instead.
type DisplayLanguage = (typeof displayLanguageEnum.enumValues)[number];

const DEEPL_TARGET_LANG: Record<DisplayLanguage, string> = {
  en: "EN-US",
  ko: "KO",
  ja: "JA",
  zh: "ZH",
};

export type TranslateResult = { ok: true; text: string } | { ok: false };

export async function translateText(
  text: string,
  targetLanguage: DisplayLanguage
): Promise<TranslateResult> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error("translateText: DEEPL_API_KEY is not configured");
    return { ok: false };
  }

  const host = apiKey.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";

  try {
    const response = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        text,
        target_lang: DEEPL_TARGET_LANG[targetLanguage],
      }),
    });

    if (!response.ok) {
      console.error(`translateText: DeepL responded ${response.status} for "${targetLanguage}"`);
      return { ok: false };
    }

    const data = (await response.json()) as { translations?: { text: string }[] };
    const translated = data.translations?.[0]?.text;
    if (!translated) {
      console.error(`translateText: DeepL returned no translation for "${targetLanguage}"`);
      return { ok: false };
    }

    return { ok: true, text: translated };
  } catch (error) {
    console.error(`translateText: request failed for "${targetLanguage}"`, error);
    return { ok: false };
  }
}
