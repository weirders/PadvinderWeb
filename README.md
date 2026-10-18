# Padvinder

Single-file hiking navigator (SFHA). Open `index.html` — no build step.

- Search Komoot routes in the visible map area (public, unofficial `discover_tours` API)
- Draw your own routes: tap to add points, move them with an offset handle or a precision slide pad, name points as highlights, add name/activity/difficulty/description (elevation via Open-Meteo on save)
- Route details, elevation profile, GPX import/export/share, drive-to-start via Google Maps
- Offline: route + map tiles around it in IndexedDB; `sw.js` caches the app so it reloads without signal
- Navigation while the screen is on: turn hints, off-route alert, way-back info, pocket mode

Map data © OpenStreetMap contributors. Routes © Komoot and their authors.
