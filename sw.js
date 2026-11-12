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

// 1. Lifecycle management for auto-updating
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// 2. Display incoming space alerts (Guarantees 1 single notification)
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || 'T&C Space Alert ';
  
  const options = {
    body: data.body || payload.notification?.body || 'New space telemetry available.',
    icon: 'assets/space-hub-icon-192.png?v=1',
    badge: 'assets/space-hub-icon-192.png?v=1',
    image: data.image || payload.notification?.image || null,
    tag: data.tag || 'space-hub-alert',
    renotify: true,
    data: { url: data.url || '/T-C-Space/' }
  };

  self.registration.showNotification(title, options);
});

// 3. Click notification: Opens app and scrolls directly to that specific subject section
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/T-C-Space/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If the app is already open, navigate and focus
      for (const client of windowClients) {
        if (client.url.includes('/T-C-Space/')) {
          client.navigate(targetUrl);
          client.postMessage({ action: 'NAVIGATE_TAB', url: targetUrl });
          return client.focus();
        }
      }
      // If closed, open fresh window
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
