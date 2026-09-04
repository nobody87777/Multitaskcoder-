// MultitaskCoder - Progressive Web App Service Worker
// Version: 4.0

const CACHE_NAME = "multitaskcoder-v4.0";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/main.css",
  "./css/themes.css",
  "./css/components.css",
  "./css/animations.css",
  "./css/responsive.css",
  "./js/app.js",
  "./js/constants.js",
  "./js/state.js",
  "./js/storage.js",
  "./js/router.js",
  "./js/utils.js",
  "./js/pages/home.js",
  "./js/pages/learn.js",
  "./js/pages/typing.js",
  "./js/pages/debugger.js",
  "./js/pages/quizzes.js",
  "./js/pages/profile.js",
  "./js/components/header.js",
  "./js/components/sidebar.js",
  "./js/components/bottom-nav.js",
  "./js/components/modal.js",
  "./js/components/cards.js",
  "./js/components/progress.js",
  "./js/components/loader.js",
  "./js/features/sandbox/sandbox-placeholder.js"
];

// Install: Cache core application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Purge obsolete caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // SPA navigation fallback: return cached index.html if offline
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Same-origin assets: Cache-First with Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
    return;
  }

  // Cross-origin assets (fonts, icons, cdn scripts): Network-First with Cache fallback
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === "opaque")) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
