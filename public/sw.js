/* Kroatien Sport Live – PWA service worker placeholder
 * Minimal offline shell cache. Extend with Workbox later.
 */
const CACHE = "ksl-shell-v1";
const PRECACHE = ["/", "/manifest.webmanifest", "/icon-192.png", "/favicon-32.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  // Network-first for navigations; cache fallback for shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/") || caches.match(req))
    );
    return;
  }
});
