"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDisplayLanguage } from "@/lib/menu/actions";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
};

export function LanguageSelector({ currentLanguage }: { currentLanguage: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const language = event.target.value;
    startTransition(async () => {
      await setDisplayLanguage(language);
      // React keeps the previous commit visible until this transition
      // resolves (FR-013) — router.refresh() re-renders the Server
      // Component tree with the cookie the action just set.
      router.refresh();
    });
  }

  return (
    <select
      value={currentLanguage}
      onChange={handleChange}
      disabled={isPending}
      aria-label="Menu language"
      className={cn(
        "rounded-full border border-white/40 bg-black/30 px-3 py-1.5 text-sm text-white outline-none",
        isPending && "opacity-60"
      )}
    >
      {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
        <option key={code} value={code} className="text-foreground">
          {label}
        </option>
      ))}
    </select>
  );
}
