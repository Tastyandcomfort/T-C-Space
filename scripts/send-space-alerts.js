const admin = require('firebase-admin');

// 1. Initialize Firebase Admin SDK
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT secret!");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const TOPIC_NAME = 'space_alerts';

// 2. Fetch NASA Astronomy Picture of the Day (APOD)
async function getAPOD() {
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`);
    const data = await res.json();
    if (data.media_type === 'image') {
      return {
        title: `🌌 Astronomy Picture of the Day: ${data.title}`,
        body: data.explanation.slice(0, 140) + '...',
        image: data.hdurl || data.url,
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (err) {
    console.error('Error fetching APOD:', err.message);
  }
  return null;
}

// 3. Fetch Approaching Asteroids (NeoWs)
async function getAsteroidAlert() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
    const data = await res.json();
    const objects = data.near_earth_objects?.[today] || [];

    // Check for any hazardous asteroid or closest flyby
    const hazardous = objects.find(obj => obj.is_potentially_hazardous_asteroid);
    const candidate = hazardous || objects[0];

    if (candidate) {
      const closeData = candidate.close_approach_data[0];
      const speed = Math.round(closeData?.relative_velocity?.kilometers_per_hour || 0).toLocaleString();
      const missDist = Math.round(closeData?.miss_distance?.kilometers || 0).toLocaleString();
      const diameter = Math.round(candidate.estimated_diameter?.meters?.estimated_diameter_max || 0);
      const isHazard = candidate.is_potentially_hazardous_asteroid;

      return {
        title: `${isHazard ? '⚠️ HAZARDOUS' : '☄️'} Asteroid Flyby: ${candidate.name}`,
        body: `Size: ~${diameter}m | Speed: ${speed} km/h\nMiss Distance: ${missDist} km\nHazard: ${isHazard ? 'POTENTIALLY HAZARDOUS' : 'Safe / Monitored'}`,
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (err) {
    console.error('Error fetching Asteroids:', err.message);
  }
  return null;
}

// 4. Fetch Solar & Geomagnetic Storms (DONKI)
async function getSolarStormAlert() {
  try {
    const res = await fetch(`https://api.nasa.gov/DONKI/GST?api_key=${NASA_KEY}`);
    const storms = await res.json();

    if (Array.isArray(storms) && storms.length > 0) {
      const latest = storms[storms.length - 1];
      const maxKp = Math.max(...latest.allKpIndex.map(k => k.kpIndex));

      if (maxKp >= 5) {
        return {
          title: `☀️ Severe Solar Storm Alert (Kp ${maxKp})`,
          body: `Active geomagnetic storm reported by NASA DONKI. Auroras possible at lower latitudes; satellite navigation telemetry fluctuations likely.`,
          url: 'https://tastyandcomfort.github.io/T-C-Space/#space-weather'
        };
      }
    }
  } catch (err) {
    console.error('Error fetching Space Weather:', err.message);
  }
  return null;
}

// 5. Fetch Upcoming Rocket Launches (Launch Library 2)
async function getRocketLaunch() {
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=1');
    const data = await res.json();
    const nextLaunch = data.results?.[0];

    if (nextLaunch) {
      const launchTime = new Date(nextLaunch.net).getTime();
      const now = Date.now();
      const diffHours = (launchTime - now) / (1000 * 60 * 60);

      // Alert if launch is within next 2 hours
      if (diffHours > 0 && diffHours <= 2) {
        return {
          title: `🚀 Launch Imminent: ${nextLaunch.name}`,
          body: `T-Minus ~${Math.round(diffHours * 60)} minutes!\nRocket: ${nextLaunch.rocket?.configuration?.name} | Pad: ${nextLaunch.pad?.name}`,
          image: nextLaunch.image || null,
          url: 'https://tastyandcomfort.github.io/T-C-Space/#launches'
        };
      }
    }
  } catch (err) {
    console.error('Error fetching Launches:', err.message);
  }
  return null;
}

// 6. Main Orchestrator: Pick the most critical alert and dispatch
async function run() {
  console.log('Checking space telemetry feeds...');

  // Priority hierarchy: Solar Storms > Imminent Rocket > Asteroid Alert > Daily APOD
  const storm = await getSolarStormAlert();
  const launch = await getRocketLaunch();
  const asteroid = await getAsteroidAlert();
  const apod = await getAPOD();

  const alertToSend = storm || launch || asteroid || apod;

  if (!alertToSend) {
    console.log('No critical alerts or APOD found. Exiting gracefully.');
    return;
  }

  console.log('Sending alert:', alertToSend.title);

  // 7. Read all registered space tokens from Firestore
  const tokensSnapshot = await admin.firestore().collection('space_fcm_tokens').get();
  const tokens = tokensSnapshot.docs.map(doc => doc.id);

  if (tokens.length === 0) {
    console.log('No registered devices found in space_fcm_tokens! Please click Test Alert on the site first.');
    return;
  }

  console.log(`Found ${tokens.length} registered device(s). Sending alert...`);

  // 8. Dispatch notification directly to all registered devices
  const message = {
    tokens: tokens,
    notification: {
      title: alertToSend.title,
      body: alertToSend.body,
      imageUrl: alertToSend.image || undefined
    },
    webpush: {
      headers: {
        Urgency: 'high'
      },
      notification: {
        title: alertToSend.title,
        body: alertToSend.body,
        icon: 'https://tastyandcomfort.github.io/T-C-Space/assets/space-hub-icon-192.png?v=1',
        badge: 'https://tastyandcomfort.github.io/T-C-Space/assets/space-hub-icon-192.png?v=1',
        image: alertToSend.image || undefined, // Displays APOD picture on lock screen
        requireInteraction: true,
        data: {
          url: alertToSend.url
        }
      },
      fcmOptions: {
        link: alertToSend.url
      }
    }
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully delivered: ${response.successCount} | Failed: ${response.failureCount}`);
  } catch (error) {
    console.error('Failed to send FCM message:', error);
    process.exit(1);
  }
}

run();
