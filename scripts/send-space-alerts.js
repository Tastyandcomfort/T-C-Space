
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

// --- TELEMETRY & ALERT FETCHERS ---

// 1. NASA APOD (With Picture)
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
  } catch (e) { console.error('APOD Error:', e.message); }
  return null;
}

// 2. Mars Rover Surface Cam (Perseverance)
async function getMarsRoverAlert() {
  try {
    const res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=${NASA_KEY}`);
    const data = await res.json();
    const photos = data.latest_photos || [];
    if (photos.length > 0) {
      const p = photos[0];
      const secureImg = p.img_src.replace(/^http:\/\//i, 'https://');
      return {
        topic: 'mars',
        title: `🔴 T&C Deep Labs: Mars Surface Cam`,
        body: `Perseverance rover beamed raw surface telemetry from Jezero Crater on Sol ${p.sol}. Tap to inspect.`,
        image: secureImg,
        url: 'https://tastyandcomfort.github.io/T-C-Space/#deep-labs'
      };
    }
  } catch (e) { console.error('Mars Error:', e.message); }
  return null;
}

// 3. EPIC: Earth from 1 Million Miles (DSCOVR)
async function getEpicEarthAlert() {
  try {
    const res = await fetch(`https://api.nasa.gov/EPIC/api/natural?api_key=${NASA_KEY}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const latest = data[0];
      const d = latest.date.split(' ')[0].split('-');
      const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${d[0]}/${d[1]}/${d[2]}/png/${latest.image}.png`;
      return {
        topic: 'epic',
        title: `🌍 Earth from 1 Million Miles (DSCOVR Probe)`,
        body: `Fresh full-disk natural color planetary view taken from deep space Lagrange Point L1.`,
        image: imgUrl,
        url: 'https://tastyandcomfort.github.io/T-C-Space/#deep-labs'
      };
    }
  } catch (e) { console.error('EPIC Error:', e.message); }
  return null;
}

// 4. Satellite Passes (ISS)
async function getSatelliteIntel() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    const data = await res.json();
    const speed = Math.round(data.velocity).toLocaleString();
    const alt = Math.round(data.altitude);

    return {
      topic: 'satellite',
      title: '🛰️ Orbital Track: ISS Live Telemetry',
      body: `ISS cruising at ${speed} km/h (${alt} km altitude). Tiangong CSS & Hubble orbital passes active.`,
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop',
      url: 'https://tastyandcomfort.github.io/T-C-Space/#satellites'
    };
  } catch (e) { console.error('Satellite Error:', e.message); }
  return null;
}

// 5. Near-Earth Asteroid Radar (NeoWs)
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
      const diam = Math.round(candidate.estimated_diameter?.meters?.estimated_diameter_max || 0);
      const isHaz = candidate.is_potentially_hazardous_asteroid;

      return {
        topic: 'asteroid',
        title: `${isHaz ? '⚠️ HAZARDOUS' : '☄️'} Asteroid Flyby: ${candidate.name}`,
        body: `Distance: ${lunar} LD (${(missDist/1e6).toFixed(2)}M km) | Speed: ${speed} km/h | Size: ~${diam}m`,
        image: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#astronomy'
      };
    }
  } catch (e) { console.error('Asteroid Error:', e.message); }
  return null;
}

// 6. NASA TechPort Inventions Radar
async function getTechPortAlert() {
  try {
    return {
      topic: 'techport',
      title: '🔬 T&C Deep Labs: NASA Inventions Radar',
      body: 'NASA logged new experimental propulsion and lunar oxygen extraction prototypes. Tap to inspect.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop',
      url: 'https://tastyandcomfort.github.io/T-C-Space/#deep-labs'
    };
  } catch (e) { console.error('TechPort Error:', e.message); }
  return null;
}

// 7. Rocket Launches
async function getRocketLaunch() {
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=1');
    const data = await res.json();
    const next = data.results?.[0];
    if (next) {
      const launchTime = new Date(next.net).getTime();
      const diffHours = (launchTime - Date.now()) / 3600000;
      return {
        topic: 'launch',
        title: `🚀 Next Orbital Flight: ${next.name}`,
        body: `T-Minus ~${Math.max(1, Math.round(diffHours))} hrs. Rocket: ${next.rocket?.configuration?.name} | Pad: ${next.pad?.name}`,
        image: next.image || 'https://images.unsplash.com/photo-1517976487502-d7102d84d12b?q=80&w=1000&auto=format&fit=crop',
        url: 'https://tastyandcomfort.github.io/T-C-Space/#launches',
        isEmergency: diffHours > 0 && diffHours <= 2
      };
    }
  } catch (e) { console.error('Launch Error:', e.message); }
  return null;
}

// 8. Solar Storms (DONKI)
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
          body: `Active geomagnetic storm reported by NASA DONKI. Auroras possible at lower latitudes.`,
          image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1000&auto=format&fit=crop',
          url: 'https://tastyandcomfort.github.io/T-C-Space/#space-weather',
          isEmergency: true
        };
      }
    }
  } catch (e) { console.error('Solar Error:', e.message); }
  return null;
}

// --- FULL ROTATION ORDER ---
async function selectNextAlert() {
  const solar = await getSolarStormAlert();
  if (solar && solar.isEmergency) return solar;

  const launch = await getRocketLaunch();
  if (launch && launch.isEmergency) return launch;

  const rotationOrder = [
    'mars',        // Mars Rover surface photo!
    'epic',        // Earth from 1 million miles photo!
    'apod',        // NASA Astronomy Picture of the Day
    'satellite',   // ISS & satellite pass tracking
    'asteroid',    // Near-Earth Asteroid Radar
    'techport',    // NASA Future Inventions Radar
    'launch'       // Upcoming global rocket flights
  ];

  const stateDoc = await db.collection('system_state').doc('space_hub_alerts').get();
  const lastTopic = stateDoc.exists ? stateDoc.data().lastTopic : '';

  let nextIndex = (rotationOrder.indexOf(lastTopic) + 1) % rotationOrder.length;
  let targetTopic = rotationOrder[nextIndex];

  console.log(`Previous alert was: "${lastTopic || 'none'}". Next topic in rotation: "${targetTopic}".`);

  let chosen = null;
  if (targetTopic === 'mars') chosen = await getMarsRoverAlert();
  else if (targetTopic === 'epic') chosen = await getEpicEarthAlert();
  else if (targetTopic === 'apod') chosen = await getAPOD();
  else if (targetTopic === 'satellite') chosen = await getSatelliteIntel();
  else if (targetTopic === 'asteroid') chosen = await getAsteroidAlert();
  else if (targetTopic === 'techport') chosen = await getTechPortAlert();
  else if (targetTopic === 'launch') chosen = launch || await getRocketLaunch();

  chosen = chosen || await getMarsRoverAlert() || await getAPOD();

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
  console.log('Running Master Space Alert Dispatcher with Mars & T&C Deep Labs...');

  const alertToSend = await selectNextAlert();
  if (!alertToSend) {
    console.log('No telemetry available right now. Exiting gracefully.');
    return;
  }

  console.log('Selected alert:', alertToSend.title);

  const tokensSnapshot = await db.collection('space_fcm_tokens').get();
  const tokens = tokensSnapshot.docs.map(doc => doc.id);

  if (tokens.length === 0) {
    console.log('No registered devices found in space_fcm_tokens.');
    return;
  }

  console.log(`Delivering alert to ${tokens.length} device(s)...`);

  // Data-only payload prevents Chrome auto-duplicate
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
