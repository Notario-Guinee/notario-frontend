const CACHE_NAME = "notaflow-v2-20260313";
const CACHE_PREFIX = "notaflow-";
const STATIC_ASSETS = ["/", "/index.html", "/favicon.ico", "/manifest.json"];

// Install
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch — Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isNavigateRequest = event.request.mode === "navigate";

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (isNavigateRequest) return caches.match("/index.html");
        return Response.error();
      })
  );
});

// Background Sync — flush outbox
self.addEventListener('sync', (event) => {
  if (event.tag === 'outbox-sync') {
    event.waitUntil(flushOutbox());
  }
});

async function flushOutbox() {
  // Open IndexedDB and replay queued requests
  // This is a stub — actual implementation requires IndexedDB access in SW
  console.log('[SW] Flushing outbox...');
}
