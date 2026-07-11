/* Smart Home Service Worker — generic, versioned, business-logic-free. */
/* eslint-disable no-restricted-globals */

const SW_VERSION = "v3";
const CACHE_PREFIX = "smarthome";
const CACHES = {
  shell: `${CACHE_PREFIX}-shell-${SW_VERSION}`,
  assets: `${CACHE_PREFIX}-assets-${SW_VERSION}`,
  images: `${CACHE_PREFIX}-images-${SW_VERSION}`,
  fonts: `${CACHE_PREFIX}-fonts-${SW_VERSION}`,
};
const OFFLINE_URL = "/offline.html";
const IMAGE_CACHE_MAX = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.allSettled(
        names.filter((n) => n.startsWith(`${CACHE_PREFIX}-`)).map((n) => caches.delete(n)),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const keep = new Set(Object.values(CACHES));
      await Promise.allSettled(
        names
          .filter((n) => n.startsWith(`${CACHE_PREFIX}-`))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({ version: SW_VERSION, caches: CACHES });
  }
  if (data.type === "CLEAR_CACHES") {
    event.waitUntil(
      (async () => {
        const names = await caches.keys();
        await Promise.allSettled(
          names.filter((n) => n.startsWith(`${CACHE_PREFIX}-`)).map((n) => caches.delete(n)),
        );
        event.ports?.[0]?.postMessage({ ok: true });
      })(),
    );
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === "smarthome-queue-flush") {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const c of clients) c.postMessage({ type: "BACKGROUND_SYNC", tag: event.tag });
      })(),
    );
  }
});

function isSameOrigin(url) {
  try { return new URL(url).origin === self.location.origin; } catch { return false; }
}

async function limitCache(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - max;
  if (excess > 0) {
    for (let i = 0; i < excess; i++) await cache.delete(keys[i]);
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await cache.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && fresh.ok) cache.put(request, fresh.clone()).catch(() => {});
  return fresh;
}

async function staleWhileRevalidate(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) {
        cache.put(request, res.clone()).then(() => limitCache(cacheName, max)).catch(() => {});
      }
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never intercept WebSocket, EventSource, POSTs, cross-origin analytics, etc.
  if (req.headers.get("upgrade") === "websocket") return;
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Navigations — NetworkFirst with offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, CACHES.shell));
    return;
  }

  if (!isSameOrigin(req.url)) return;

  const dest = req.destination;
  if (dest === "image") {
    event.respondWith(staleWhileRevalidate(req, CACHES.images, IMAGE_CACHE_MAX));
    return;
  }
  if (dest === "font") {
    event.respondWith(cacheFirst(req, CACHES.fonts));
    return;
  }
  if (dest === "style" || dest === "script" || dest === "worker") {
    event.respondWith(cacheFirst(req, CACHES.assets));
    return;
  }
});
