const CACHE_NAME = 'parijs-site-v0-13';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/photos/arc.jpg',
  '/assets/photos/disney.jpg',
  '/assets/photos/eiffel.jpg',
  '/assets/photos/louvre.jpg',
  '/assets/photos/montmartre.jpg',
  '/assets/photos/sacrecoeur.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const clone = response.clone();
      if (event.request.url.startsWith(self.location.origin)) {
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match('/index.html')))
  );
});
