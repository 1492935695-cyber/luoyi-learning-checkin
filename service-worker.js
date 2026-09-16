const CACHE_NAME = "luoyi-checkin-v9-spring-20260916c";
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
  "./robots.txt",
  "./learn-island.html",
  "./spring-island.html",
  "./spring-island.css?v=20260916c",
  "./spring-story.js?v=20260916c",
  "./spring-world.js?v=20260916c",
  "./vendor/three.module.js",
  "./vendor/loaders/GLTFLoader.js",
  "./vendor/utils/BufferGeometryUtils.js",
  "./assets/spring/spring.glb",
  "./assets/spring/ATTRIBUTION.txt",
  "./assets/qingting-badge-original.jpg",
  "./learn-island.css?v=20260916b",
  "./adventure-game.js?v=20260916b",
  "./adventure-world.js?v=20260916b",
  "./adventure-lessons.js?v=20260916b",
  "./adventure-report.js?v=20260916b",
  "./adventure-oral.js?v=20260916b",
  "./pinyin-pro.min.js",
  "./lucide.min.js",
  "./learning.webmanifest",
  "./learning-icon.svg",
  "./learning-icon-192.png",
  "./learning-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("luoyi-checkin-") && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.registration.scope)) return;
  // Video players on iOS request byte ranges. Cache.put rejects 206 responses.
  if (event.request.headers.has("range")) {
    event.respondWith(fetch(event.request));
    return;
  }
  const remote = fetch(event.request).then(async (response) => {
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  });
  event.waitUntil(remote.catch(() => {}));
  event.respondWith((async () => {
    const cached = await caches.match(event.request) || await caches.match(new URL(event.request.url).pathname);
    if (cached) {
      // A weak connection must not leave an already downloaded lesson waiting forever.
      let timer;
      try {
        const response = await Promise.race([remote, new Promise(resolve => { timer = setTimeout(() => resolve(null), 1800); })]);
        return response && response.ok ? response : cached;
      } catch (_) { return cached; }
      finally { clearTimeout(timer); }
    }
    try { return await remote; }
    catch (_) { return new Response('Please reconnect to load this page for the first time.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
  })());
});
