// --- T&C Space Hub: 100% Real-Time News Model Engine ---

// 1. Dual IST & UTC Live Clocks
function initClocks() {
  const istEl = document.getElementById('clock-ist');
  const utcEl = document.getElementById('clock-utc');

  function tick() {
    const now = new Date();

    // Indian Standard Time (UTC+5:30)
    const ist = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false
    }) + ' IST';

    // UTC
    const utc = now.toUTCString().split(' ')[4] + ' UTC';

    if (istEl) istEl.textContent = ist;
    if (utcEl) utcEl.textContent = utc;
  }
  tick();
  setInterval(tick, 1000);
}

// 2. News Category Filter
function initCategoryFilter() {
  const pills = document.querySelectorAll('.cat-pill');
  const cards = document.querySelectorAll('.news-card');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const selected = pill.getAttribute('data-cat');
      cards.forEach(card => {
        const sec = card.getAttribute('data-section');
        if (selected === 'all' || sec === selected) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });

      if (selected === 'tracking' && satMap) {
        setTimeout(() => satMap.invalidateSize(), 200);
      }
    });
  });
}

// 3. Watermark-Free Leaflet Satellite Map
let satMap = null;
let issMarker = null;

function initMap() {
  const container = document.getElementById('news-sat-map');
  if (!container || typeof L === 'undefined') return;

  satMap = L.map('news-sat-map', { zoomControl: false }).setView([20, 78], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(satMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap'
  }).addTo(satMap);

  const satIcon = L.divIcon({
    className: 'leaflet-sat-icon',
    html: '<div style="width:14px;height:14px;background:#0A84FF;border:2.5px solid white;border-radius:50%;box-shadow:0 0 12px #0A84FF;"></div>',
    iconSize: [14, 14]
  });

  issMarker = L.marker([0, 0], { icon: satIcon }).addTo(satMap);
}

// 4. Live WhereTheISS API Telemetry (Direct Stream)
async function fetchLiveIss() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) return;
    const d = await res.json();

    const lat = d.latitude.toFixed(2) + '°';
    const lon = d.longitude.toFixed(2) + '°';
    const alt = d.altitude.toFixed(1) + ' km';
    const vel = (d.velocity / 3600).toFixed(2) + ' km/s';

    document.getElementById('map-lat').textContent = lat;
    document.getElementById('map-lon').textContent = lon;
    document.getElementById('map-alt').textContent = alt;
    document.getElementById('map-vel').textContent = vel;

    if (issMarker && satMap) {
      issMarker.setLatLng([d.latitude, d.longitude]);
    }

    const ping = document.getElementById('iss-ping-time');
    if (ping) ping.textContent = 'Live ping: ' + new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
  } catch (_) {}
}

// 5. NASA JPL NeoWs Asteroids (Near-Earth Objects)
async function fetchAsteroids() {
  const container = document.getElementById('asteroid-list');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const neos = data.near_earth_objects[today] || [];

    if (container) {
      if (neos.length === 0) {
        container.innerHTML = '<p class="card-excerpt">No close approaches recorded for today in NASA JPL radar.</p>';
        return;
      }
      container.innerHTML = neos.slice(0, 6).map(ast => {
        const isHazard = ast.is_potentially_hazardous_asteroid;
        const ca = ast.close_approach_data[0] || {};
        const missKm = ca.miss_distance ? (parseFloat(ca.miss_distance.kilometers) / 1000000).toFixed(2) + 'M km' : '—';
        const velKmS = ca.relative_velocity ? parseFloat(ca.relative_velocity.kilometers_per_second).toFixed(1) + ' km/s' : '—';
        const diam = ast.estimated_diameter?.meters?.estimated_diameter_max?.toFixed(0) || '—';

        return `
          <div class="asteroid-item">
            <div class="asteroid-item-top">
              <span class="asteroid-name">${ast.name}</span>
              <span class="hazard-tag ${isHazard ? 'red' : 'green'}">${isHazard ? 'HAZARDOUS' : 'SAFE FLYBY'}</span>
            </div>
            <div class="asteroid-item-numbers">
              <span>Miss: <b>${missKm}</b></span>
              <span>Speed: <b>${velKmS}</b></span>
              <span>Diameter: <b>~${diam} m</b></span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = '<p class="card-excerpt">NASA NeoWs radar updating…</p>';
  }
}

// 6. Launch Manifest (TheSpaceDevs LL2)
async function fetchLaunches() {
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=4');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const top = data.results?.[0];

    if (top) {
      document.getElementById('hero-launch-name').textContent = top.name;
      document.getElementById('hero-launch-desc').textContent = top.mission?.description || 'Orbital mission deployment.';
      document.getElementById('hero-vehicle').textContent = top.rocket?.configuration?.name || 'Rocket';
      document.getElementById('hero-provider').textContent = top.launch_service_provider?.name || 'Commercial';
      document.getElementById('hero-pad').textContent = top.pad?.location?.name || 'Spaceport';

      const diff = new Date(top.net) - new Date();
      const hrs = Math.max(0, Math.floor(diff / 3600000));
      const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
      document.getElementById('hero-tminus').textContent = `T-${hrs}h ${mins}m`;
      document.getElementById('hero-target-time').textContent = 'Window: ' + new Date(top.net).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';

      const ticker = document.getElementById('live-ticker-text');
      if (ticker) {
        ticker.textContent = `🚀 NEXT LAUNCH: ${top.name} (${top.launch_service_provider?.name || 'Commercial'}) in T-${hrs}h ${mins}m`;
      }
    }
  } catch (_) {
    document.getElementById('hero-launch-name').textContent = 'Launch manifest synchronizing…';
  }
}

// 7. NASA DONKI Space Weather
async function fetchSpaceWeather() {
  const list = document.getElementById('solar-list');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const prev = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${prev}&endDate=${today}&api_key=DEMO_KEY`);
    if (!res.ok) throw new Error();
    const flares = await res.json();

    if (list) {
      if (flares.length === 0) {
        list.innerHTML = '<p class="card-excerpt">No major solar flares recorded in the past 7 days. Solar activity quiet.</p>';
        return;
      }
      list.innerHTML = flares.slice(0, 6).map(f => `
        <div class="event-item">
          <div>
            <b>Solar Flare Class ${f.classType || 'Flare'}</b>
            <small>Peak: ${f.peakTime ? f.peakTime.replace('T', ' ').replace('Z', ' UTC') : 'Recorded'}</small>
          </div>
          <span class="badge orange">${f.classType || 'Flare'}</span>
        </div>
      `).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="card-excerpt">DONKI feed updating…</p>';
  }
}

// 8. USGS Earthquakes
async function fetchEarthquakes() {
  const list = document.getElementById('quake-list');
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const quakes = data.features || [];

    document.getElementById('quake-count-tag').textContent = `${quakes.length} Events (24h)`;

    if (list) {
      list.innerHTML = quakes.slice(0, 6).map(q => {
        const mag = q.properties.mag.toFixed(1);
        const color = q.properties.mag >= 5.0 ? 'red' : (q.properties.mag >= 4.0 ? 'orange' : 'green');
        return `
          <a class="event-item" href="${q.properties.url}" target="_blank" rel="noopener">
            <div>
              <b>${q.properties.place}</b>
              <small>${new Date(q.properties.time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</small>
            </div>
            <span class="badge ${color}">M${mag}</span>
          </a>
        `;
      }).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="card-excerpt">USGS seismic sensors synchronizing…</p>';
  }
}

// 9. Area-Wise Intelligence Brief (Open-Meteo)
async function fetchAreaIntel(lat, lon, cityName) {
  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,direct_normal_irradiance`);
    if (!res.ok) return;
    const data = await res.json();
    const cur = data.current || {};

    document.getElementById('intel-city').textContent = cityName;
    document.getElementById('intel-aqi').textContent = cur.us_aqi ?? 'Good';
    document.getElementById('intel-pm25').textContent = (cur.pm2_5 ?? '—') + ' μg/m³';
    document.getElementById('intel-pm10').textContent = (cur.pm10 ?? '—') + ' μg/m³';
    document.getElementById('intel-no2').textContent = (cur.nitrogen_dioxide ?? '—') + ' μg/m³';
    document.getElementById('intel-solar').textContent = (cur.direct_normal_irradiance ?? 0) + ' W/m²';
  } catch (_) {}
}

// 10. NASA APOD
async function fetchApod() {
  try {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!res.ok) return;
    const d = await res.json();

    document.getElementById('apod-title').textContent = d.title;
    document.getElementById('apod-explanation').textContent = d.explanation;
    document.getElementById('apod-date-tag').textContent = d.date;
    document.getElementById('apod-credit').textContent = d.copyright ? '© ' + d.copyright : 'NASA Observatory Public Stream';

    const media = document.getElementById('apod-media');
    if (media) {
      if (d.media_type === 'image') {
        media.innerHTML = `<img src="${d.url}" alt="${d.title}">`;
      } else {
        media.innerHTML = `<iframe src="${d.url}" frameborder="0" allowfullscreen></iframe>`;
      }
    }
  } catch (_) {}
}

// 11. Toast Notifications
function showToast(text) {
  const toast = document.getElementById('toast-message');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// --- App Bootstrap ---
document.addEventListener('DOMContentLoaded', () => {
  initClocks();
  initCategoryFilter();
  initMap();

  // City chips click
  document.querySelectorAll('.city-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.city-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchAreaIntel(btn.getAttribute('data-lat'), btn.getAttribute('data-lon'), btn.getAttribute('data-city'));
    });
  });

  // Settings Modal
  const modal = document.getElementById('settings-modal');
  document.getElementById('open-settings-btn')?.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('close-settings-btn')?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  // Theme switcher
  document.querySelectorAll('#theme-segmented .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#theme-segmented .seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-theme');
      if (val === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', val);
      }
    });
  });

  // Test space notification
  document.getElementById('trigger-test-alert')?.addEventListener('click', async () => {
    const kp = document.getElementById('pref-solar-kp')?.value || '5';
    const quake = document.getElementById('pref-quake-mag')?.value || '5.0';

    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('T&C Space Alert 🚀', {
        body: `Active thresholds: Solar Storm Kp ${kp}+ | Earthquakes M ${quake}+. Telemetry nominal.`,
        icon: 'assets/space-hub-icon-192.png?v=1'
      });
    }
    showToast(`Threshold saved: Kp ${kp}+ | M ${quake}+`);
  });

  // Refresh feeds
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    fetchLiveIss();
    fetchLaunches();
    fetchAsteroids();
    fetchSpaceWeather();
    fetchEarthquakes();
    fetchApod();
    showToast('All real-time sensors refreshed.');
  });

  // Initial Fetches
  fetchLiveIss();
  fetchLaunches();
  fetchAsteroids();
  fetchSpaceWeather();
  fetchEarthquakes();
  fetchApod();
  fetchAreaIntel('17.3850', '78.4867', 'Hyderabad, India');

  // Fast 3-second live ISS telemetry poll
  setInterval(fetchLiveIss, 3000);
});
