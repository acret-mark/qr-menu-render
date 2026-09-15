"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Ports qr-menu-dev's AccountTabs near-verbatim (research.md Decision 1),
// adapted for this project's "disabled until built" pattern (Support —
// same convention already used for OwnerTabBar/AdminShell) since this
// project's support-ticket-management admin spec hasn't shipped yet.
const TABS = [
  { key: "profile", label: "Profile", title: "Business Profile", enabled: true },
  { key: "subscription", label: "Subscription", title: "Subscription", enabled: true },
  { key: "support", label: "Support", title: "Support", enabled: false },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTabKey(value: string): value is TabKey {
  return TABS.some((tab) => tab.key === value && tab.enabled);
}

function subscribeToHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

function getHashTab(): TabKey {
  const hash = window.location.hash.slice(1);
  return isTabKey(hash) ? hash : "profile";
}

function getServerTab(): TabKey {
  return "profile";
}

export function AccountTabs({
  profilePanel,
  subscriptionPanel,
  supportPanel,
}: {
  profilePanel: React.ReactNode;
  subscriptionPanel: React.ReactNode;
  supportPanel: React.ReactNode;
}) {
  // Deep-linkable via URL hash (#profile / #subscription), so other screens
  // can link straight to a tab (e.g. specs/009's StatusBanner, a future
  // consumer). useSyncExternalStore reads the SSR-safe "profile" snapshot
  // during hydration and only switches to the real hash afterward, so the
  // server and client's first render always agree (a plain useState
  // initializer reading window.location.hash would diverge from the server
  // and fail hydration whenever the URL already has a hash).
  const activeTab = useSyncExternalStore(subscribeToHash, getHashTab, getServerTab);

  function selectTab(tab: TabKey) {
    window.history.replaceState(null, "", `#${tab}`);
    // replaceState doesn't fire "hashchange" on its own — dispatch it so the
    // external store re-reads the new hash and re-renders.
    window.dispatchEvent(new Event("hashchange"));
  }

  const activeTitle = TABS.find((tab) => tab.key === activeTab)!.title;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border p-6 pb-4">
        <Link href="/dashboard" aria-label="Back to dashboard" className="text-muted-foreground">
          ←
        </Link>
        <h1 className="text-xl font-semibold">{activeTitle}</h1>
      </div>

      <nav className="flex border-b border-border px-4">
        {TABS.map((tab) =>
          tab.enabled ? (
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
          ) : (
            <span
              key={tab.key}
              aria-disabled="true"
              className="flex-1 cursor-not-allowed border-b-2 border-transparent py-3.5 text-center text-sm font-medium text-muted-foreground/50"
            >
              {tab.label}
            </span>
          )
        )}
      </nav>

      <div className="p-6" hidden={activeTab !== "profile"}>
        {profilePanel}
      </div>
      <div className="p-6" hidden={activeTab !== "subscription"}>
        {subscriptionPanel}
      </div>
      <div className="p-6" hidden={activeTab !== "support"}>
        {supportPanel}
      </div>
    </div>
  );
}
