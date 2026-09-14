"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE_NAME, isDisplayLanguage } from "@/lib/menu/language";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export type SetDisplayLanguageResult = { ok: boolean };

/**
 * Sets the hapag_lang cookie (same name/shape as qr-menu-dev's own).
 * Next.js automatically revalidates the calling route after a Server
 * Action runs — the page (a Server Component reading cookies() on every
 * request) re-renders with the new language on the next paint, with no
 * client-side fetch/cache needed (research.md Decision 3).
 */
export async function setDisplayLanguage(language: string): Promise<SetDisplayLanguageResult> {
  if (!isDisplayLanguage(language)) {
    return { ok: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(LANG_COOKIE_NAME, language, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  return { ok: true };
}
