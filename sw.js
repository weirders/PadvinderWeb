/* Padvinder service worker — optional companion to padvinder.html.
   Put it next to the HTML on your (HTTPS) host. It:
   - keeps a copy of the app so it reloads without signal,
   - serves a generated web-app manifest + icons so the app can be installed.
   Map tiles and routes live in IndexedDB and don't depend on this file. */
const CACHE = 'padvinder-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(self.registration.scope).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#1f5a3d"/><path d="M14 48 28 20l8 14 6-8 8 22z" fill="#f6f4ee"/><circle cx="44" cy="18" r="5" fill="#e8571a"/></svg>`;

async function pngIcon(size) {
  try {
    const c = new OffscreenCanvas(size, size), g = c.getContext('2d'), s = size / 64;
    g.fillStyle = '#1f5a3d'; g.fillRect(0, 0, size, size);
    g.fillStyle = '#f6f4ee'; g.beginPath();
    [[14, 48], [28, 20], [36, 34], [42, 26], [50, 48]].forEach(([x, y], i) => i ? g.lineTo(x * s, y * s) : g.moveTo(x * s, y * s));
    g.closePath(); g.fill();
    g.fillStyle = '#e8571a'; g.beginPath(); g.arc(44 * s, 18 * s, 5 * s, 0, Math.PI * 2); g.fill();
    return new Response(await c.convertToBlob({ type: 'image/png' }), { headers: { 'Content-Type': 'image/png' } });
  } catch {
    return new Response(ICON_SVG, { headers: { 'Content-Type': 'image/svg+xml' } });
  }
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // tiles/APIs go straight to network
  const scope = new URL(self.registration.scope);
  const rel = url.pathname.slice(scope.pathname.length);

  if (rel === 'manifest.webmanifest') {
    e.respondWith(new Response(JSON.stringify({
      name: 'Padvinder', short_name: 'Padvinder', start_url: './', scope: './', display: 'standalone',
      background_color: '#1f5a3d', theme_color: '#1f5a3d', orientation: 'portrait',
      icons: [
        { src: 'pv-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: 'pv-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        { src: 'pv-icon.svg', sizes: 'any', type: 'image/svg+xml' }
      ]
    }), { headers: { 'Content-Type': 'application/manifest+json' } }));
    return;
  }
  if (rel === 'pv-icon-192.png') return e.respondWith(pngIcon(192));
  if (rel === 'pv-icon-512.png') return e.respondWith(pngIcon(512));
  if (rel === 'pv-icon.svg') return e.respondWith(new Response(ICON_SVG, { headers: { 'Content-Type': 'image/svg+xml' } }));

  // App pages: network first (so updates arrive), cached copy when offline.
  if (req.mode === 'navigate' || /\.html?$/.test(url.pathname) || url.pathname === scope.pathname) {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res.ok) { cache.put(req, res.clone()); cache.put(scope.href, res.clone()); }
        return res;
      } catch {
        return (await cache.match(req, { ignoreSearch: true })) || (await cache.match(scope.href)) ||
          new Response('Offline and no cached copy yet — open Padvinder once while online.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
  }
});
