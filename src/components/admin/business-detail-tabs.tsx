"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// specs/018-business-detail. Structurally mirrors specs/014's AccountTabs
// (hash-based switching, useSyncExternalStore for SSR safety) but is its
// own component instance (research.md Decision 3) — a different tab set
// for a different screen (admin business detail vs. owner account),
// deliberately not shared/parameterized for two call sites.
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "menu", label: "Menu" },
  { key: "history", label: "Subscription History" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string): value is TabKey {
  return TABS.some((tab) => tab.key === value);
}

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashTab(): TabKey {
  const hash = window.location.hash.slice(1);
  return isTabKey(hash) ? hash : "overview";
}

function getServerTab(): TabKey {
  return "overview";
}

export function BusinessDetailTabs({
  overviewPanel,
  menuPanel,
  historyPanel,
}: {
  overviewPanel: React.ReactNode;
  menuPanel: React.ReactNode;
  historyPanel: React.ReactNode;
}) {
  const activeTab = useSyncExternalStore(subscribeToHash, getHashTab, getServerTab);

  function selectTab(tab: TabKey) {
    window.history.replaceState(null, "", `#${tab}`);
    window.dispatchEvent(new Event("hashchange"));
  }

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border bg-card">
      <nav className="flex border-b border-border px-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => selectTab(tab.key)}
            className={cn(
              "flex-1 border-b-2 py-3.5 text-center text-sm font-medium",
              tab.key === activeTab
                ? "border-primary font-semibold text-foreground"
                : "border-transparent text-muted-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="p-6" hidden={activeTab !== "overview"}>
        {overviewPanel}
      </div>
      <div className="p-0" hidden={activeTab !== "menu"}>
        {menuPanel}
      </div>
      <div className="p-0" hidden={activeTab !== "history"}>
        {historyPanel}
      </div>
    </div>
  );
}
