const CACHE = 'fins-v2';
const ASSETS = ['./index.html', './logo.png', './manifest.json'];

// ── Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// ── Message: reminder check from main app
self.addEventListener('message', e => {
  if (e.data?.type !== 'FINS_CHECK_REMINDER') return;

  const lastTxDate = e.data.lastTxDate; // 'YYYY-MM-DD' or null
  if (!lastTxDate) return;

  const now = new Date();

  // TEST: saat kısıtlaması yok (normal: hour < 20 || hour >= 22)
  // if (hour < 20 || hour >= 22) return;

  const lastDate = new Date(lastTxDate + 'T00:00:00');
  const minutesSince = (now - lastDate) / 60000; // TEST: dakika cinsinden

  if (minutesSince >= 1) { // TEST: 1 dakika (normal: daysSince >= 3)
    self.registration.showNotification('Fins 💰', {
      body: 'Bugün hiç harcama yazmadın mı, yoksa yazmayı mı unuttun? 💰',
      icon: './logo.png',
      badge: './logo.png',
      tag: 'fins-reminder',
      renotify: true, // TEST: true yap ki her seferinde görünsün
      vibrate: [200, 100, 200],
      data: { url: './' }
    });
  }
});

// ── Notification click: open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      for (const c of cls) {
        if (c.url.includes('index.html') || c.url.endsWith('/')) return c.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});
