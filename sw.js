/* 小日和 Hiyori — service worker: offline shell + push notifications */
const V = 'hiyori-v3';
const CORE = ['./', './index.html', './app.js', './art.css', './config.js', './manifest.webmanifest',
  './icon-192.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (/supabase\.(co|in)$/.test(u.hostname)) return; // your data always comes live from the cloud
  if (u.origin === location.origin) {
    // network first so updates arrive right away; cached copy when offline
    e.respondWith(fetch(r).then((res) => {
      if (res.ok) { const c = res.clone(); caches.open(V).then((x) => x.put(r, c)); }
      return res;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || caches.match('./index.html'))));
    return;
  }
  if (/cdn\.jsdelivr\.net$|fonts\.googleapis\.com$|fonts\.gstatic\.com$/.test(u.hostname)) {
    e.respondWith(caches.open(V).then(async (c) => {
      const m = await c.match(r);
      const f = fetch(r).then((res) => { if (res.ok || res.type === 'opaque') c.put(r, res.clone()); return res; }).catch(() => m);
      return m || f;
    }));
  }
});

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || '小日和', {
    body: d.body || '',
    tag: d.tag || undefined,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: d.url || './' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) {
      if ('focus' in w) { if (w.navigate) w.navigate(url).catch(() => {}); return w.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
