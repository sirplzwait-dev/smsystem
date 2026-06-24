// sw.js
const CACHE_NAME = 'sagun-pwa-v1';
const ASSETS = [
    'index.html',
    'register.html',
    'setup.html',
    'report.html',
    'login.html'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});