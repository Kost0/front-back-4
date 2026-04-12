'use strict';

const APP_SHELL_CACHE = 'app-shell-v4';
const DYNAMIC_CACHE = 'dynamic-content-v2';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './content/home.html',
  './content/about.html',
  './icons/favicon-16x16.png',
  './icons/favicon-32x32.png',
  './icons/favicon-128x128.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== APP_SHELL_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (
    url.pathname === '/subscribe' ||
    url.pathname === '/unsubscribe' ||
    url.pathname === '/snooze' ||
    url.pathname.startsWith('/socket.io/')
  ) return;

  if (url.pathname.startsWith('/content/')) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    const clone = response.clone();
    const cache = await caches.open(APP_SHELL_CACHE);
    cache.put(request, clone);
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const clone = response.clone();
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('./content/home.html');
  }
}

self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '', reminderId: null };
  if (event.data) {
    try { data = event.data.json(); }
    catch { data.body = event.data.text(); }
  }

  const options = {
    body: data.body || '',
    icon: './icons/favicon-128x128.png',
    badge: './icons/favicon-32x32.png',
    requireInteraction: !!data.reminderId,
    data: { reminderId: data.reminderId || null },
    actions: data.reminderId
      ? [{ action: 'snooze', title: '⏰ Отложить на 5 минут' }]
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Уведомление', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  notification.close();

  if (action === 'snooze') {
    const reminderId = notification.data && notification.data.reminderId;
    const snoozeUrl = self.location.origin + '/snooze?reminderId=' + reminderId;

    console.log('[SW] Snooze clicked, calling:', snoozeUrl);

    event.waitUntil(
      fetch(snoozeUrl, { method: 'POST' })
        .then(res => {
          if (!res.ok) throw new Error('Server returned ' + res.status);
          console.log('[SW] Snooze OK for reminder', reminderId);
        })
        .catch(err => console.error('[SW] Snooze failed:', err))
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        const appClient = windowClients.find(c => c.url.includes(self.location.origin));
        if (appClient) return appClient.focus();
        return clients.openWindow('/');
      })
    );
  }
});