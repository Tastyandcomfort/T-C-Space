importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAOn8eFL_CMGuYVeEa9hfpdkHRxZpjacqU",
  authDomain: "news-61e62.firebaseapp.com",
  projectId: "news-61e62",
  storageBucket: "news-61e62.firebasestorage.app",
  messagingSenderId: "1054060055660",
  appId: "1:1054060055660:web:e192c256c82facb9af1c49"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Rich Mobile Background Notification Handler (Title Model 1 & 3 with Rich Image Preview)
messaging.onBackgroundMessage((payload) => {
  const category = payload.data?.category || 'Space Alert';
  const emoji = payload.data?.emoji || '🚀';
  const title = payload.notification?.title || payload.data?.title || `T&C Space · ${category} ${emoji}`;
  const targetUrl = payload.data?.url || payload.data?.click_action || './#overview';
  const imageUrl = payload.notification?.image || payload.data?.image || null;

  const options = {
    body: payload.notification?.body || payload.data?.body || 'New live telemetry update available.',
    icon: 'assets/space-hub-icon-192.png?v=1',
    badge: 'assets/space-hub-icon-192.png?v=1',
    image: imageUrl, // Full-bleed notification photo preview
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: targetUrl }
  };

  self.registration.showNotification(title, options);
});

// Click-to-Open Navigation: Opens and navigates directly to the alert's specific section
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || './#overview';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes('T-C-Space') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
