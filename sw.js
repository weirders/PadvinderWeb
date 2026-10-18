/* Padvinder service worker.
   Keeps a copy of the app (page, manifest, icons) so it reloads and installs without signal.
   The manifest and icons are real files next to index.html: Android builds the installed app
   (WebAPK) by fetching them directly from the server, so they must not exist only in here.
   Map tiles and routes live in IndexedDB and don't depend on this file. */
const CACHE = 'padvinder-v2';
const ASSETS = ['manifest.webmanifest', 'pv-icon-192.png', 'pv-icon-512.png', 'pv-icon-maskable-192.png', 'pv-icon-maskable-512.png', 'pv-icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(
    [self.registration.scope, ...ASSETS.map(a => new URL(a, self.registration.scope).href)].map(u => c.add(u).catch(() => {}))
  )));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // tiles/APIs go straight to network
  const scope = new URL(self.registration.scope);
  const rel = url.pathname.slice(scope.pathname.length);

  // App pages, manifest and icons: network first (so updates arrive), cached copy when offline.
  if (req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname === scope.pathname || ASSETS.includes(rel)) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) {
          cache.put(req, res.clone());
          if (!ASSETS.includes(rel)) cache.put(scope.href, res.clone());
        }
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) ||
          (ASSETS.includes(rel) ? Response.error() : (await cache.match(scope.href))) ||
          new Response('Offline and no cached copy yet — open Padvinder once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
  }
});
