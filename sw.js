// Offline support. The network is tried first, so a new version shows up as
// soon as it is published; the cache answers only when the network cannot.
const CACHE = 'learn-poker-v3';

// Fetched at install so the app works offline from the first visit.
// test/ranges.test.mjs fails if a file under js/ or css/ is missing here.
const SHELL = [
  './',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'css/app.css',
  'js/app.js',
  'js/charts.js',
  'js/components.js',
  'js/dom.js',
  'js/drill.js',
  'js/feedback.js',
  'js/home.js',
  'js/nav.js',
  'js/play.js',
  'js/ranges.js',
  'js/sizing.js',
  'js/spotdrill.js',
  'js/store.js',
  'js/table.js',
  'js/topicprogress.js',
  'js/coldcall/model.js',
  'js/coldcall/pages.js',
  'js/data/coldcall.js',
  'js/data/preflop-ranges.js',
  'js/data/threebet.js',
  'js/preflop/edges.js',
  'js/preflop/learn.js',
  'js/preflop/model.js',
  'js/preflop/open.js',
  'js/preflop/paint.js',
  'js/preflop/progress.js',
  'js/threebet/model.js',
  'js/threebet/pages.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url)))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const ours = url.origin === self.location.origin;
  const font = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!ours && !font) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    } catch (err) {
      const hit = (await cache.match(request)) || (request.mode === 'navigate' ? await cache.match('./') : null);
      if (hit) return hit;
      throw err;
    }
  })());
});
