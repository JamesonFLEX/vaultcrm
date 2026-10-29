/**
 * VaultCRM service worker — instant repeat loads.
 * Serves the app shell from the device cache immediately, then refreshes the
 * cache in the background (stale-while-revalidate). New deploys show up on the
 * next visit. API calls (server mode) are never cached.
 */
const CACHE = 'vault-shell-v1';
const SHELL = [
  './', 'index.html', 'app.css', 'app.js', 'local-engine.js',
  'img/vault-logo.svg', 'img/marble-dark.webp', 'img/marble-light.webp'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !isFont) return;
  if (sameOrigin && url.pathname.includes('/api/')) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      // ?local=1 and similar flags don't change the file, so ignore them on the page itself
      const cached = await cache.match(req, { ignoreSearch: sameOrigin && req.mode === 'navigate' });
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
