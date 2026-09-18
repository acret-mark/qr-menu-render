"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { setDisplayLanguage } from "@/lib/menu/actions";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<string, { short: string; full: string }> = {
  en: { short: "EN", full: "English" },
  ko: { short: "KO", full: "한국어" },
  ja: { short: "JA", full: "日本語" },
  zh: { short: "ZH", full: "中文" },
};

// Custom pill dropdown button/menu, replacing a native <select> — matches
// qr-menu-dev's language-selector.tsx visual language (specs/026-menu-home-
// rebrand). The state-update mechanism is unchanged from before this pass:
// still a server action (setDisplayLanguage) + router.refresh() inside a
// transition, just triggered from a custom menu item's onClick instead of a
// <select>'s onChange (Clarifications — qr-menu-render computes the display
// language server-side in page.tsx, unlike qr-menu-dev's client-side
// useTranslatedCategories hook, so there's no isTranslating/current state to
// lift from a hook here — `isPending` from this component's own
// useTransition stands in for it).
//
// Only ever rendered on the hero (MenuHeader, over the primary-colored
// background) in this codebase — no non-hero usage exists to justify a
// `variant` prop the way qr-menu-dev's component has one, so this ships a
// single "on-hero" white-pill style only.
export function LanguageSelector({ currentLanguage }: { currentLanguage: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleSelect(language: string) {
    setOpen(false);
    startTransition(async () => {
      await setDisplayLanguage(language);
      // React keeps the previous commit visible until this transition
      // resolves — router.refresh() re-renders the Server Component tree
      // with the cookie the action just set.
      router.refresh();
    });
  }

  const current = LANGUAGE_LABELS[currentLanguage] ?? {
    short: currentLanguage.toUpperCase(),
    full: currentLanguage,
  };

  return (
    <div className="relative ml-auto shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-busy={isPending}
        disabled={isPending}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex items-center gap-1 rounded-full bg-white px-2.5 py-1.5 text-[0.78rem] font-semibold text-foreground shadow-md",
          isPending && "opacity-60"
        )}
      >
        <span>{current.short}</span>
        {isPending ? (
          <Loader2 className="size-3 animate-spin" aria-label="Updating…" />
        ) : (
          <ChevronDown className="size-3" />
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+6px)] right-0 z-20 min-w-[140px] rounded-md border border-border bg-card p-1 shadow-lg"
        >
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => handleSelect(code)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[0.85rem] text-foreground",
                  code === currentLanguage && "bg-secondary font-semibold"
                )}
              >
                {label.full}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
