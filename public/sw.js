/* Minimal service worker: installable PWA + offline shell.
 *
 * Strategy
 *  - Install: precache / and /login (static shells) plus /offline.html and the icons.
 *  - Navigations: network first, fall back to the last cached page, then /offline.html.
 *  - /_next/static and /icons: cache first (filenames are content-hashed, so this is safe).
 *  - Everything cross-origin (Supabase API, Google auth) and /auth/*: never touched by the worker.
 *
 * Bump CACHE_VERSION when you change this file so old caches are removed.
 */
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `jt-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `jt-static-${CACHE_VERSION}`;
// Pages whose HTML is cached for offline use (both are thin client-side shells).
const SHELL_PAGES = ['/', '/login'];
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(async (c) => {
        await c.addAll(PRECACHE);
        // The two pages are identical for everyone (no personal data), so they are safe to cache up front.
        // Best effort: a failed fetch here must not block installing the worker.
        await Promise.allSettled(SHELL_PAGES.map((page) => c.add(page)));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL_CACHE, STATIC_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/auth/') || url.pathname === '/sw.js') return;
  if (url.searchParams.has('_rsc')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && SHELL_PAGES.includes(url.pathname)) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(SHELL_PAGES.includes(url.pathname) ? url.pathname : req);
          return cached || (await caches.match('/offline.html')) || Response.error();
        }),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

/* Placeholder for phase 2 (Web Push). Intentionally inert until a push backend exists.
self.addEventListener('push', (event) => { ... });
self.addEventListener('notificationclick', (event) => { ... });
*/
