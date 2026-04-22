// Vitaryo service worker
// Handles push notifications and notificationclick.

const CACHE = 'vitaryo-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal network-first pass-through so the PWA works offline for the shell.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache API or cron endpoints.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    (async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
        return net;
      } catch (e) {
        const cached = await caches.match(req);
        return cached || new Response('Offline', { status: 503 });
      }
    })()
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Vitaryo', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Vitaryo';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag || 'vitaryo-reminder',
    renotify: true,
    data: {
      url: data.url || '/',
      intakeId: data.intakeId || null,
    },
    actions: data.intakeId
      ? [
          { action: 'taken', title: '✓ Genommen' },
          { action: 'snooze', title: '⏰ 30 Min' },
        ]
      : [],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const intakeId = event.notification.data && event.notification.data.intakeId;
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  if (event.action === 'taken' && intakeId) {
    event.waitUntil(
      fetch('/api/intakes/' + intakeId + '/taken', { method: 'POST' }).catch(() => {})
    );
    return;
  }
  if (event.action === 'snooze' && intakeId) {
    event.waitUntil(
      fetch('/api/intakes/' + intakeId + '/snooze', { method: 'POST' }).catch(() => {})
    );
    return;
  }

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of allClients) {
        if (c.url.includes(self.location.origin)) {
          c.focus();
          c.navigate(targetUrl);
          return;
        }
      }
      await self.clients.openWindow(targetUrl);
    })()
  );
});
