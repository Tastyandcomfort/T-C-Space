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

// Catches background push messages and wakes up mobile devices
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || 'T&C Space Alert 🚀';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New live orbital event detected.',
    icon: 'assets/space-hub-icon-192.png?v=1',
    badge: 'assets/space-hub-icon-192.png?v=1',
    image: payload.notification?.image || payload.data?.image || null,
    vibrate: [200, 100, 200]
  };
  self.registration.showNotification(title, options);
});
