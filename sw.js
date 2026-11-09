importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAOn8eFL_CMGuYVeEa9hfpdkHRxZpjacqU",
  authDomain: "news-61e62.firebaseapp.com",
  projectId: "news-61e62",
  storageBucket: "news-61e62.firebasestorage.app",
  messagingSenderId: "1054060055660",
  appId: "1:1054060055660:web:e192c256c82facb9af1c49"
});

const messaging = firebase.messaging();

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// ONLY ONE HANDLER: Prevents double notifications
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'T&C Space Alert 🚀';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New space telemetry available.',
    icon: 'assets/space-hub-icon-192.png?v=1',
    badge: 'assets/space-hub-icon-192.png?v=1',
    image: payload.notification?.image || payload.notification?.imageUrl || null,
    tag: payload.data?.tag || 'space-alert', // Collapses duplicates
    renotify: false,
    data: { url: payload.data?.url || '/T-C-Space/' }
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/T-C-Space/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/T-C-Space/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
