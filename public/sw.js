/* SCORA PWA service worker — scope "/" */
const SW_VERSION = 'scora-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch {
        /* ignore */
      }
    })(),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    try {
      payload = { body: event.data ? event.data.text() : '' };
    } catch {
      payload = {};
    }
  }

  const title = payload.title || 'SCORA';
  const options = {
    body: payload.body || 'You have a new SCORA update.',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    vibrate: payload.vibrate || [120, 60, 120],
    requireInteraction: payload.requireInteraction !== false,
    tag: payload.tag || 'scora-push',
    renotify: true,
    data: {
      url: payload.url || payload.start_url || '/',
      ...((payload.data && typeof payload.data === 'object') ? payload.data : {}),
    },
  };

  event.waitUntil(
    (async () => {
      try {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const visible = clientsList.some((c) => c.visibilityState === 'visible');
        if (visible && payload.skipIfVisible) return;
      } catch {
        /* show anyway */
      }
      await self.registration.showNotification(title, options);
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsList) {
        if ('focus' in client) {
          try {
            await client.focus();
            if ('navigate' in client && targetUrl) {
              await client.navigate(targetUrl);
            }
            return;
          } catch {
            /* try next */
          }
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'PING' || data.type === 'SCORA_PING') {
    event.waitUntil(
      self.registration.showNotification(data.title || 'SCORA', {
        body: data.body || 'In-app ping — alerts are working.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'scora-ping',
        data: { url: data.url || '/' },
      }),
    );
  }
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Keep a version marker for debugging in DevTools.
self.__SCORA_SW_VERSION = SW_VERSION;
