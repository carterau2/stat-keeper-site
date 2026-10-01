// The copy of the app that opens with no signal. Rule 2: offline is the normal case.
//
// This file is a template. The build (offline/plugin.ts) fills in the build id and the list of
// every file the app is made of, and writes the result next to index.html as sw.js.
//
// How it behaves:
// - Installing downloads every file of this build into its own cache. If one file fails, the
//   install fails as a whole and the previous copy keeps serving. A half-downloaded app is
//   never served.
// - Once installed, the app is always served from that cache, never from the network, so it
//   opens the same with full signal, one bar, or none.
// - A newer build replaces the cache as a whole. The page that is open keeps running what it
//   has (a game in progress is never reloaded underneath the keeper); the next time the app is
//   opened it is the new build.
// - Nothing here touches the games. They live in the device's database, not in this cache.
const BUILD = "2026-10-01T05:36:00.529Z";
const FILES = ["./","assets/index-Ci_YlC3e.js","assets/index-zs3kzrsa.css","favicon.svg","icons/icon-180.png","icons/icon-192.png","icons/icon-512.png","manifest.webmanifest"];

// One cache per build, named for this app's address so two apps on the same site never clear
// each other's copy.
const PREFIX = `shell|${self.registration.scope}|`;
const CACHE = PREFIX + BUILD;
const SHELL = new URL('./', self.registration.scope).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // 'reload' goes past the browser's own cache, so an old file can never be stored as new.
      await cache.addAll(FILES.map((f) => new Request(new URL(f, self.registration.scope).href, { cache: 'reload' })));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Opening the app (any address inside it) is always the one page.
      const hit = req.mode === 'navigate' ? await cache.match(SHELL, { ignoreVary: true }) : await cache.match(req, { ignoreSearch: true, ignoreVary: true });
      return hit ?? fetch(req);
    })(),
  );
});

// The page asks which build is installed, to show it on the home page.
self.addEventListener('message', (event) => {
  if (event.data === 'build') event.source?.postMessage({ build: BUILD });
});
