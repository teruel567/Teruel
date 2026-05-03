const CACHE_NAME = "omega-ai-v1";

// Install
self.addEventListener("install", (event) => {
  self.skipWaiting(); // 🔥 force update

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/style.css",
        "/script.js",
        "/manifest.json",
        "/logo.png"
      ]);
    })
  );
});

// Activate
self.addEventListener("activate", (event) => {
  self.clients.claim(); // 🔥 take control immediately

  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
});

// Fetch
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Always bypass cache for API
  if (url.pathname.startsWith("/api/")) {
    return event.respondWith(fetch(event.request));
  }

  // Cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          if (!res || res.status !== 200) return res;

          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });

          return res;
        })
      );
    })
  );
});
