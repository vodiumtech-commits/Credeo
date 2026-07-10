/* Vodium Ledger service worker — conservative caching.
 * - Never caches API/auth responses.
 * - Cache-first for static assets (fast repeat loads).
 * - Network-first for page navigations, with an offline fallback. */
const CACHE = "vodium-v1";
const OFFLINE_URL = "/offline";
const STATIC_RE = /\.(?:css|js|png|jpg|jpeg|svg|webp|gif|ico|woff2?)$/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache API/auth

  // Static assets: cache-first.
  if (url.pathname.startsWith("/_next/static") || STATIC_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Page navigations: network-first, offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(req);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match(OFFLINE_URL)) || Response.error();
        }
      })()
    );
  }
});
