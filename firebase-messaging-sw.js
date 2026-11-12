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

// Contextual NASA space photography for notification banners (Never your app icon)
const NOTIFICATION_PHOTOS = {
  satellite: 'https://images-assets.nasa.gov/image/iss064e007861/iss064e007861~medium.jpg', // ISS orbiting Earth
  launch: 'https://images-assets.nasa.gov/image/KSC-20221116-PH-KLS01_0003/KSC-20221116-PH-KLS01_0003~medium.jpg', // Rocket liftoff
  solar: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001435/GSFC_20171208_Archive_e001435~medium.jpg', // SDO solar flare
  quake: 'https://images-assets.nasa.gov/image/iss065e094294/iss065e094294~medium.jpg', // Earth atmospheric horizon
  asteroid: 'https://images-assets.nasa.gov/image/PIA24430/PIA24430~medium.jpg', // Asteroid surface
  cosmic: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000494/GSFC_20171208_Archive_e000494~medium.jpg' // High-res deep space nebula capture
};

messaging.onBackgroundMessage((payload) => {
  const category = payload.data?.category || 'Space Alert';
  const emoji = payload.data?.emoji || '🚀';
  const title = payload.notification?.title || payload.data?.title || `T&C Space · ${category} ${emoji}`;
  const targetUrl = payload.data?.url || payload.data?.click_action || './#overview';
  
  // Pick real space photo banner based on alert type
  let bannerPhoto = payload.notification?.image || payload.data?.image;
  if (!bannerPhoto || bannerPhoto.includes('space-hub-icon')) {
    const catLower = category.toLowerCase();
    if (catLower.includes('pass') || catLower.includes('orbital') || catLower.includes('sat')) {
      bannerPhoto = NOTIFICATION_PHOTOS.satellite;
    } else if (catLower.includes('launch') || catLower.includes('liftoff') || catLower.includes('rocket')) {
      bannerPhoto = NOTIFICATION_PHOTOS.launch;
    } else if (catLower.includes('solar') || catLower.includes('sun') || catLower.includes('weather')) {
      bannerPhoto = NOTIFICATION_PHOTOS.solar;
    } else if (catLower.includes('seismic') || catLower.includes('quake') || catLower.includes('earth')) {
      bannerPhoto = NOTIFICATION_PHOTOS.quake;
    } else if (catLower.includes('asteroid') || catLower.includes('comet') || catLower.includes('neo')) {
      bannerPhoto = NOTIFICATION_PHOTOS.asteroid;
    } else if (catLower.includes('cosmic') || catLower.includes('planet') || catLower.includes('photo') || catLower.includes('telescope') || catLower.includes('jwst') || catLower.includes('hubble') || catLower.includes('explorer')) {
      bannerPhoto = NOTIFICATION_PHOTOS.cosmic;
    } else {
      bannerPhoto = NOTIFICATION_PHOTOS.satellite;
    }
  }

  const options = {
    body: payload.notification?.body || payload.data?.body || 'New live telemetry update available.',
    icon: 'assets/space-hub-icon-192.png?v=1', // Logo stays ONLY as the small avatar on the left
    badge: 'assets/space-hub-icon-192.png?v=1',
    image: bannerPhoto, // Real NASA space photograph across top banner
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { url: targetUrl }
  };

  self.registration.showNotification(title, options);
});

// Click-to-Open Navigation
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
