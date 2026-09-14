const CACHE_NAME = "luoyi-checkin-v6-owner-20260914c";
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./game.html",
  "./game.css",
  "./game.js",
  "./space-puzzle.html",
  "./space-puzzle.css",
  "./space-puzzle.js",
  "./space-puzzle.html?v=20260914c",
  "./space-puzzle.css?v=20260914c",
  "./space-puzzle.js?v=20260914c",
  "./three.min.js",
  "./island-logic.js?v=20260914c",
  "./island-hint-worker.js?v=20260914c",
  "./manifest.webmanifest",
  "./app-icon.svg",
  "./robots.txt"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("luoyi-checkin-") && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match(new URL(event.request.url).pathname)))
  );
});
