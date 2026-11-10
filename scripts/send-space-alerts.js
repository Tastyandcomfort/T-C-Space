const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT secret!");
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const NASA_KEY = process.env.NASA_API_KEY || 'fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd';

// Date utility for accurate real-time query windows
function getISODateRange(daysBack = 2) {
  const end = new Date();
  const start = new Date(end.getTime() - daysBack * 86400000);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

// 1. APOD
async function getAPOD() {
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_KEY}`);
    const data = await res.json();
    if (data.media_type === 'image') {
      return {
        topic: 'apod',
        category: 'apod',
        title: `🌌 APOD: ${data.title}`,
        body: data.explanation.slice(0, 130) + '...',
        image: data.hdurl || data.url || '',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (e) {}
  return null;
}

// 2. Real-Time Solar Weather (STRICT 48-HOUR LIVE WINDOW - NO HISTORICAL FAKES)
async function getSolarStormAlert() {
  try {
    const { start, end } = getISODateRange(2);
    const res = await fetch(`https://api.nasa.gov/DONKI/GST?startDate=${start}&endDate=${end}&api_key=${NASA_KEY}`);
    const storms = await res.json();
    if (Array.isArray(storms) && storms.length > 0) {
      const latest = storms[storms.length - 1];
      const maxKp = Math.max(...latest.allKpIndex.map(k => k.kpIndex));
      if (maxKp >= 5) {
        return {
          topic: 'solar',
          category: 'solar',
          title: `☀️ Severe Solar Storm Alert (Kp ${maxKp})`,
          body: `Live geomagnetic disturbance active today. Reported by NASA DONKI.`,
          image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
          url: 'https://tastyandcomfort.github.io/T-C-Space/#space-weather',
          isEmergency: true
        };
      }
    }
  } catch (e) {}
  return null;
}

// 3. Near-Earth Asteroid Radar (Today Only)
async function getAsteroidAlert() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_KEY}`);
    const data = await res.json();
    const objects = data.near_earth_objects?.[today] || [];
    const candidate = objects.find(o => o.is_potentially_hazardous_asteroid) || objects[0];

    if (candidate) {
      const closeData = candidate.close_approach_data[0];
      const speed = Math.round(closeData?.relative_velocity?.kilometers_per_hour || 0).toLocaleString();
      const missDist = Math.round(closeData?.miss_distance?.kilometers || 0);
      const lunar = (missDist / 384400).toFixed(1);
      const isHaz = candidate.is_potentially_hazardous_asteroid;

      return {
        topic: 'asteroid',
        category: 'asteroid',
        title: `${isHaz ? '⚠️ HAZARDOUS' : '☄️'} Asteroid Flyby: ${candidate.name}`,
        body: `Flyby Distance: ${lunar} LD (${(missDist/1e6).toFixed(2)}M km) | Relative Speed: ${speed} km/h`,
        image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (e) {}
  return null;
}

// 4. Mars Rover Surface Cam (Fresh Downlink)
async function getMarsRoverAlert() {
  try {
    let res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=${NASA_KEY}`);
    let data = await res.json();
    let photos = data.latest_photos || [];
    let roverName = "Perseverance";

    if (!photos.length) {
      res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_KEY}`);
      data = await res.json();
      photos = data.latest_photos || [];
      roverName = "Curiosity";
    }

    if (photos.length > 0) {
      const p = photos[0];
      const secureImg = p.img_src.replace(/^http:\/\//i, 'https://');
      return {
        topic: 'mars',
        category: 'mars',
        title: `🔴 Mars Rover Surface Cam (${roverName})`,
        body: `Raw surface frame received from Sol ${p.sol} (${p.camera?.name || 'Camera'}).`,
        image: secureImg,
        url: 'https://tastyandcomfort.github.io/T-C-Space/#deep-labs'
      };
    }
  } catch (e) {}
  return null;
}

// 5. Strictly Future Rocket Launches
async function getRocketLaunch() {
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5');
    const data = await res.json();
    const now = Date.now();
    // Filter to only genuinely upcoming launches!
    const upcoming = (data.results || []).filter(l => new Date(l.net).getTime() > now);

    if (upcoming.length > 0) {
      const nextLaunch = upcoming[0];
      const diffHours = (new Date(nextLaunch.net).getTime() - now) / 3600000;
      return {
        topic: 'launch',
        category: 'launch',
        title: `🚀 Next Flight Countdown: ${nextLaunch.name}`,
        body: `T-Minus ~${Math.max(1, Math.round(diffHours))} hrs. Pad: ${nextLaunch.pad?.name || 'Spaceport'}.`,
        image: nextLaunch.image || 'https://images.unsplash.com/photo-1517976487502-d7102d84d12b?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#launches',
        isEmergency: diffHours > 0 && diffHours <= 2
      };
    }
  } catch (e) {}
  return null;
}

// 6. Live ISS Tracking
async function getSatelliteIntel() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    const data = await res.json();
    const speed = Math.round(data.velocity).toLocaleString();
    const alt = Math.round(data.altitude);

    return {
      topic: 'satellite',
      category: 'satellite',
      title: '🛰️ ISS Orbital Pass Telemetry',
      body: `International Space Station cruising at ${speed} km/h (${alt} km altitude).`,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
      url: 'https://tastyandcomfort.github.io/T-C-Space/#satellites'
    };
  } catch (e) {}
  return null;
}

// 7. Earthquakes (M4.5+ Last 24 Hours)
async function getEarthquakeAlert() {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
    const data = await res.json();
    const quakes = data.features || [];
    if (quakes.length > 0) {
      const q = quakes[0];
      return {
        topic: 'earthquake',
        category: 'earthquake',
        title: `🌐 USGS Seismic Alert: M ${q.properties.mag.toFixed(1)}`,
        body: `Seismic event recorded near ${q.properties.place}. Depth: ${q.geometry.coordinates[2]} km.`,
        image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#earth-monitor'
      };
    }
  } catch (e) {}
  return null;
}

// Smart Rotation
async function selectNextAlert() {
  const solar = await getSolarStormAlert();
  if (solar && solar.isEmergency) return solar;

  const launch = await getRocketLaunch();
  if (launch && launch.isEmergency) return launch;

  const rotationOrder = ['mars', 'apod', 'satellite', 'asteroid', 'earthquake', 'launch'];

  const stateDoc = await db.collection('system_state').doc('space_hub_alerts').get();
  const lastTopic = stateDoc.exists ? stateDoc.data().lastTopic : '';

  let nextIndex = (rotationOrder.indexOf(lastTopic) + 1) % rotationOrder.length;
  let targetTopic = rotationOrder[nextIndex];

  let chosen = null;
  if (targetTopic === 'mars') chosen = await getMarsRoverAlert();
  else if (targetTopic === 'apod') chosen = await getAPOD();
  else if (targetTopic === 'satellite') chosen = await getSatelliteIntel();
  else if (targetTopic === 'asteroid') chosen = await getAsteroidAlert();
  else if (targetTopic === 'earthquake') chosen = await getEarthquakeAlert();
  else if (targetTopic === 'launch') chosen = launch || await getRocketLaunch();

  chosen = chosen || await getAPOD() || await getSatelliteIntel();

  if (chosen) {
    await db.collection('system_state').doc('space_hub_alerts').set({
      lastTopic: chosen.topic,
      lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
      title: chosen.title
    }, { merge: true });
  }

  return chosen;
}

async function run() {
  const alertToSend = await selectNextAlert();
  if (!alertToSend) {
    console.log('No telemetry alert ready. Exiting.');
    return;
  }

  console.log('Selected alert:', alertToSend.title);

  // Read all device tokens AND their category preferences!
  const tokensSnapshot = await db.collection('space_fcm_tokens').get();
  const targetTokens = [];

  tokensSnapshot.forEach(doc => {
    const data = doc.data();
    const prefs = data.preferences || {};
    // If the user has disabled this category, skip them!
    if (prefs[alertToSend.category] !== false) {
      targetTokens.push(doc.id);
    }
  });

  if (targetTokens.length === 0) {
    console.log(`No users opted in for category "${alertToSend.category}".`);
    return;
  }

  console.log(`Delivering to ${targetTokens.length} opted-in device(s)...`);

  const message = {
    tokens: targetTokens,
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
