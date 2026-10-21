/* 精簡的 Service Worker：讓 PWA 可安裝，並提供離線外殼。
 *
 * 策略
 *  - 安裝時：預先快取 / 與 /login（靜態外殼），以及 /offline.html 和圖示。
 *  - 頁面導覽：網路優先，失敗時用最後快取的頁面，再不行就用 /offline.html。
 *  - /_next/static 與 /icons：快取優先（檔名含內容雜湊，所以安全）。
 *  - 所有跨網域請求（Supabase API、Google 登入）與 /auth/*：Service Worker 完全不處理。
 *
 * 修改這個檔案時要調高 CACHE_VERSION，舊的快取才會被清掉。
 */
const CACHE_VERSION = 'v3';
const SHELL_CACHE = `jt-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `jt-static-${CACHE_VERSION}`;
// 會為了離線使用而快取 HTML 的頁面（兩者都是薄的前端外殼）。
const SHELL_PAGES = ['/', '/login'];
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then(async (c) => {
        await c.addAll(PRECACHE);
        // 這兩個頁面對所有人都一樣（不含個人資料），所以可以安全地預先快取。
        // 盡力而為：這裡抓取失敗不能阻擋 Service Worker 安裝。
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

/* 第二階段（Web Push）的預留位置。在有推播後端之前刻意保持不啟用。
self.addEventListener('push', (event) => { ... });
self.addEventListener('notificationclick', (event) => { ... });
*/
