<!-- Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js"></script>

<script>
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  async function enableSpaceNotifications() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const swRegistration = await navigator.serviceWorker.ready;
        
        // Get unique FCM device token
        const token = await messaging.getToken({
          vapidKey: "YOUR_PUBLIC_VAPID_KEY",
          serviceWorkerRegistration: swRegistration
        });

        if (token) {
          console.log("FCM Device Token:", token);
          // Send this token to your backend/Firestore collection so the cron-job can send alerts to it
          await saveTokenToDatabase(token);
          alert("Space Alerts Enabled! You will receive APOD photos, asteroid radar, and storm alerts.");
        }
      }
    } catch (err) {
      console.error("Notification permission failed:", err);
    }
  }

  // Hook this to your "🔔 Test Space Alert Notification" button or settings toggle
  const testAlertBtn = document.getElementById('test-alert-btn');
  if (testAlertBtn) {
    testAlertBtn.addEventListener('click', enableSpaceNotifications);
  }
</script>
