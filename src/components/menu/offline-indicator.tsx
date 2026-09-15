"use client";

import { useEffect, useSyncExternalStore } from "react";

// specs/027-offline-caching-pwa. Registered with a narrower scope than the
// script's own directory (site root, since Next always serves public/
// files from "/") — no Service-Worker-Allowed header is needed for that,
// only for widening scope. This keeps the worker's fetch handler from
// ever seeing /admin (or the owner dashboard) requests (research.md
// Decision 2).
const SERVICE_WORKER_URL = "/sw.js";
const SERVICE_WORKER_SCOPE = "/menu/";

// research.md Decision 3: navigator.onLine + the online/offline events are
// what drive the stale-data indicator — not a handshake with the service
// worker — since the network-first strategy already guarantees "online"
// and "showing cached content" never disagree for this feature's routes.
// Subscribing via useSyncExternalStore (rather than useState+useEffect) is
// the SSR-safe way to read a browser API like this: the server snapshot
// below stands in for the always-server-rendered initial HTML (which has
// no notion of connectivity), and the client re-syncs to the real value on
// hydration without a manual setState-in-effect call.
function subscribe(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  // No connectivity concept during server rendering — assume online, same
  // as what a normal (non-cached) SSR pass always produces.
  return true;
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: SERVICE_WORKER_SCOPE })
      .catch(() => {
        // Offline caching is a resilience enhancement, not a hard
        // requirement for the menu to function — a registration failure
        // (unsupported browser, blocked by a privacy setting) must never
        // break the online experience.
      });
  }, []);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-[0.8rem] text-warning-foreground"
    >
      You&rsquo;re offline — showing a saved version of this menu, which may be outdated.
    </div>
  );
}
