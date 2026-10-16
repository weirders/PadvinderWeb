# Padvinder

Single-file hiking navigator (SFHA). Open `index.html` — no build step.

- Search Komoot routes in the visible map area (public, unofficial `discover_tours` API)
- Route details, elevation profile, GPX import/export/share, drive-to-start via Google Maps
- Offline: route + map tiles around it in IndexedDB; `sw.js` caches the app so it reloads without signal
- Navigation while the screen is on: turn hints, off-route alert, way-back info, pocket mode

Map data © OpenStreetMap contributors. Routes © Komoot and their authors.
