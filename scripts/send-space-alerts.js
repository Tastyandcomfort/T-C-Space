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

const db = admin.firestore();
const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

// --- TELEMETRY & ALERT FETCHERS ---

// 1. NASA Astronomy Picture of the Day (APOD)
async function getAPOD() {
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`);
    const data = await res.json();
    if (data.media_type === 'image') {
      return {
        topic: 'apod',
        title: `🌌 APOD: ${data.title}`,
        body: data.explanation.slice(0, 130) + '...',
        image: data.hdurl || data.url || '',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (err) {
    console.error('APOD Error:', err.message);
  }
  return null;
}

// 2. ISS Orbital Pass Intelligence
async function getSatelliteIntel() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    const data = await res.json();
    const speed = Math.round(data.velocity).toLocaleString();
    const alt = Math.round(data.altitude);

    return {
      topic: 'satellite',
      title: '🛰️ ISS Orbital Pass Intelligence',
      body: `International Space Station is cruising at ${speed} km/h (${alt} km altitude). Tap to view live orbital track.`,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
      url: 'https://tastyandcomfort.github.io/T-C-Space/#satellites'
    };
  } catch (err) {
    console.error('Satellite Error:', err.message);
  }
  return null;
}

// 3. Near-Earth Asteroid Radar (NeoWs)
async function getAsteroidAlert() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
    const data = await res.json();
    const objects = data.near_earth_objects?.[today] || [];
    const candidate = objects.find(obj => obj.is_potentially_hazardous_asteroid) || objects[0];

    if (candidate) {
      const closeData = candidate.close_approach_data[0];
      const speed = Math.round(closeData?.relative_velocity?.kilometers_per_hour || 0).toLocaleString();
      const missDist = Math.round(closeData?.miss_distance?.kilometers || 0).toLocaleString();
      const diameter = Math.round(candidate.estimated_diameter?.meters?.estimated_diameter_max || 0);
      const isHazard = candidate.is_potentially_hazardous_asteroid;

      return {
        topic: 'asteroid',
        title: `${isHazard ? '⚠️ HAZARDOUS' : '☄️'} Asteroid Flyby: ${candidate.name}`,
        body: `Size: ~${diameter}m | Speed: ${speed} km/h\nMiss Distance: ${missDist} km. Status: ${isHazard ? 'Monitored Close' : 'Safe Flyby'}.`,
        image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (err) {
    console.error('Asteroid Error:', err.message);
  }
  return null;
}

// 4. Upcoming Rocket Launches (Launch Library 2)
async function getRocketLaunch() {
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=1');
    const data = await res.json();
    const nextLaunch = data.results?.[0];

    if (nextLaunch) {
      const launchTime = new Date(nextLaunch.net).getTime();
      const diffHours = (launchTime - Date.now()) / (1000 * 60 * 60);

      return {
        topic: 'launch',
        title: `🚀 Next Orbital Flight: ${nextLaunch.name}`,
        body: `T-Minus ~${Math.max(1, Math.round(diffHours))} hrs. Rocket: ${nextLaunch.rocket?.configuration?.name} | Pad: ${nextLaunch.pad?.name}`,
        image: nextLaunch.image || 'https://images.unsplash.com/photo-1517976487502-d7102d84d12b?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#launches',
        isEmergency: diffHours > 0 && diffHours <= 2 // High alert if launch is under 2 hours away
      };
    }
  } catch (err) {
    console.error('Launch Error:', err.message);
  }
  return null;
}

// 5. Solar Storms & Space Weather (DONKI)
async function getSolarStormAlert() {
  try {
    const res = await fetch(`https://api.nasa.gov/DONKI/GST?api_key=${NASA_KEY}`);
    const storms = await res.json();

    if (Array.isArray(storms) && storms.length > 0) {
      const latest = storms[storms.length - 1];
      const maxKp = Math.max(...latest.allKpIndex.map(k => k.kpIndex));

      if (maxKp >= 5) {
        return {
          topic: 'solar',
          title: `☀️ Severe Solar Storm Alert (Kp ${maxKp})`,
          body: `Active geomagnetic storm reported by NASA DONKI. Auroras possible at lower latitudes; satellite navigation telemetry fluctuations likely.`,
          image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
          url: 'https://tastyandcomfort.github.io/T-C-Space/#space-weather',
          isEmergency: true
        };
      }
    }
  } catch (err) {
    console.error('Space Weather Error:', err.message);
  }
  return null;
}

// --- SMART ROTATION LOGIC ---
async function selectNextAlert() {
  // 1. Check for immediate critical emergencies
  const solar = await getSolarStormAlert();
  if (solar && solar.isEmergency) return solar;

  const launch = await getRocketLaunch();
  if (launch && launch.isEmergency) return launch;

  // 2. Normal rotation queue
  const rotationOrder = ['apod', 'satellite', 'asteroid', 'launch'];

  // Check state stored in Firestore
  const stateDoc = await db.collection('system_state').doc('space_hub_alerts').get();
  const lastTopic = stateDoc.exists ? stateDoc.data().lastTopic : '';

  let nextIndex = (rotationOrder.indexOf(lastTopic) + 1) % rotationOrder.length;
  let targetTopic = rotationOrder[nextIndex];

  console.log(`Last topic: "${lastTopic || 'none'}". Next rotating topic: "${targetTopic}".`);

  let chosen = null;
  if (targetTopic === 'apod') chosen = await getAPOD();
  else if (targetTopic === 'satellite') chosen = await getSatelliteIntel();
  else if (targetTopic === 'asteroid') chosen = await getAsteroidAlert();
  else if (targetTopic === 'launch') chosen = launch || await getRocketLaunch();

  // Fallback if target had no fresh data
  chosen = chosen || await getAPOD() || await getAsteroidAlert();

  // Update state in Firestore so the next run picks the next subject
  if (chosen) {
    await db.collection('system_state').doc('space_hub_alerts').set({
      lastTopic: chosen.topic,
      lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
      title: chosen.title
    }, { merge: true });
  }

  return chosen;
}

// --- DISPATCHER ---
async function run() {
  console.log('Running Space Alert Dispatcher with Smart Rotation...');

  const alertToSend = await selectNextAlert();
  if (!alertToSend) {
    console.log('No telemetry available. Exiting gracefully.');
    return;
  }

  console.log('Selected alert:', alertToSend.title);

  // Read all device tokens from Firestore
  const tokensSnapshot = await db.collection('space_fcm_tokens').get();
  const tokens = tokensSnapshot.docs.map(doc => doc.id);

  if (tokens.length === 0) {
    console.log('No registered devices found in space_fcm_tokens.');
    return;
  }

  console.log(`Sending to ${tokens.length} registered device(s)...`);

  // DATA-ONLY MESSAGE: Completely prevents duplicate notifications on Chrome
  const message = {
    tokens: tokens,
    data: {
      title: String(alertToSend.title),
      body: String(alertToSend.body),
      image: String(alertToSend.image || ''),
      url: String(alertToSend.url),
      tag: `space-${alertToSend.topic}`
    }
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Delivered: ${response.successCount} | Failed: ${response.failureCount}`);
  } catch (error) {
    console.error('Failed to send FCM message:', error);
    process.exit(1);
  }
}

run();
