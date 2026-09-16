// Offline caching service worker for the customer-facing public menu
// (specs/027-offline-caching-pwa). Registered with scope "/menu/" (see
// offline-indicator.tsx), so only documents under /menu/... ever have this
// worker as their controller — /admin and every owner-dashboard route
// never reach this file at all. Hand-rolled against native Service Worker
// + Cache Storage APIs; no build step, no external dependency (research.md
// Decision 1).

const CACHE_NAME = "menu-cache-v1";

self.addEventListener("install", () => {
  // Activate this version as soon as it finishes installing, rather than
  // waiting for every existing tab to close first — there's no versioned
  // asset conflict to worry about since every strategy below always
  // prefers the network when it's available.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

// A page under /menu/ — its initial HTML navigation, and the RSC-payload
// fetches Next.js issues for client-side soft navigation between the menu
// screens (research.md Decision 2, item 1).
function isMenuPageRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/menu/");
}

// Content-hashed hydration JS/CSS — immutable per build (Decision 2, item 2).
function isStaticAssetRequest(url) {
  return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
}

// Item/business photos served via Cloudinary (Decision 2, item 3 — the same
// host already declared in next.config.ts's images.remotePatterns, specs/007).
function isCloudinaryPhotoRequest(url) {
  return url.hostname === "res.cloudinary.com";
}

// Network-first, falling back to cache on failure. Used for the menu page
// itself so that being online always means seeing live data (FR-005,
// FR-006) — the cache is only ever read from when the network attempt
// fails. Throws when both the network and the cache miss, so the caller
// can produce the distinct "never cached" fallback (User Story 3).
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (networkError) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw networkError;
  }
}

// Cache-first, falling back to network. Used for content-addressed static
// assets and photos, which don't need re-fetching once cached (FR-001).
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

// User Story 3 / FR-007: when a /menu/ page has never been cached (so
// networkFirst's cache.match also misses) and the network is unreachable,
// this is what's shown instead of the browser's own offline error page.
// Built inline, not fetched or precached, so there's no chicken-and-egg
// dependency on a resource that itself might not be cached.
function offlineFallbackResponse() {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Menu unavailable offline</title>
<style>
  body { margin: 0; display: flex; min-height: 100vh; align-items: center; justify-content: center;
    padding: 24px; font-family: system-ui, sans-serif; background: #fff; color: #1b1b18; text-align: center; }
  .box { max-width: 320px; }
  h1 { font-size: 1.1rem; margin: 0 0 8px; }
  p { font-size: 0.9rem; color: #6b6b68; margin: 0; }
</style>
</head>
<body>
  <div class="box">
    <h1>You&rsquo;re offline</h1>
    <p>This menu hasn&rsquo;t been saved for offline viewing yet. Connect to the internet and open it once to make it available offline.</p>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Cache Storage only supports GET; nothing under /menu/ issues a
  // mutating request anyway (the customer menu is read-only).
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (isMenuPageRequest(url)) {
    event.respondWith(networkFirst(request).catch(() => offlineFallbackResponse()));
    return;
  }

  if (isStaticAssetRequest(url) || isCloudinaryPhotoRequest(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Not ours — let the browser's normal network handling apply.
});
