const CACHE_NAME = "sagun-pwa-v1";

const urlsToCache = [
  "./",
  "./login.html",
  "./index.html",
  "./admin.html",
  "./report.html",
  "./bride.jpg",
  "./groom.jpg",
  "./appicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});