// --- T&C Space Hub: 100% Real-Time Engine (IST & Apple HIG) ---

// 1. Dual Clock (IST & UTC Live Sync)
function initClocks() {
  const istEl = document.getElementById('ist-clock');
  const utcEl = document.getElementById('utc-clock');

  function tick() {
    const now = new Date();

    // Indian Standard Time (UTC+5:30)
    const istString = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false
    }) + ' IST';

    // UTC
    const utcString = now.toUTCString().split(' ')[4] + ' UTC';

    if (istEl) istEl.textContent = istString;
    if (utcEl) utcEl.textContent = utcString;
  }
  tick();
  setInterval(tick, 1000);
}

// 2. Navigation Routing
function navigateToSpace(spaceId) {
  const views = document.querySelectorAll('.space-view');
  const buttons = document.querySelectorAll('.nav-btn, .dock-btn');
  const title = document.getElementById('page-title');

  const titles = {
    'overview': 'Mission Control',
    'satellites': 'Orbital Tracking',
    'launches': 'Rockets & Flights',
    'planetary': 'Space Weather',
    'earth-intel': 'Area Intel Brief',
    'cosmos': 'Cosmos & Wiki'
  };

  views.forEach(v => {
    v.classList.remove('active');
    if (v.id === `view-${spaceId}`) v.classList.add('active');
  });

  buttons.forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-space') === spaceId);
  });

  if (title && titles[spaceId]) title.textContent = titles[spaceId];
  window.location.hash = spaceId;

  if (spaceId === 'satellites' && satMap) {
    setTimeout(() => satMap.invalidateSize(), 200);
  }
}

// 3. Real-Time Leaflet Satellite Map
let satMap = null;
let issMarker = null;

function initMap() {
  const container = document.getElementById('sat-leaflet-map');
  if (!container || typeof L === 'undefined') return;

  satMap = L.map('sat-leaflet-map', { zoomControl: false }).setView([20, 78], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(satMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap & CARTO'
  }).addTo(satMap);

  const satIcon = L.divIcon({
    className: 'leaflet-sat-icon',
    html: '<div style="width:14px;height:14px;background:#0A84FF;border:2.5px solid white;border-radius:50%;box-shadow:0 0 12px #0A84FF;"></div>',
    iconSize: [14, 14]
  });

  issMarker = L.marker([0, 0], { icon: satIcon }).addTo(satMap);
}

// 4. Live WhereTheISS API Telemetry (Direct stream)
async function fetchLiveIss() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) return;
    const d = await res.json();

    const alt = d.altitude.toFixed(1) + ' km';
    const vel = (d.velocity / 3600).toFixed(2) + ' km/s';
    const lat = d.latitude.toFixed(2) + '°';
    const lon = d.longitude.toFixed(2) + '°';

    const altVal = document.getElementById('iss-alt-val');
    const velVal = document.getElementById('iss-vel-val');
    if (altVal) altVal.textContent = alt;
    if (velVal) velVal.textContent = vel;

    document.getElementById('map-lat').textContent = lat;
    document.getElementById('map-lon').textContent = lon;
    document.getElementById('map-alt').textContent = alt;
    document.getElementById('map-spd').textContent = vel;

    if (issMarker && satMap) {
      issMarker.setLatLng([d.latitude, d.longitude]);
    }

    const ping = document.getElementById('last-ping');
    if (ping) ping.textContent = 'Live ping: ' + new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
  } catch (_) {}
}

// 5. Area-Wise Intelligence Brief (Open-Meteo Real-time ground sensors)
async function fetchAreaIntel(lat, lon, cityName) {
  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,direct_normal_irradiance`);
    if (!res.ok) return;
    const data = await res.json();
    const cur = data.current || {};

    document.getElementById('intel-city').textContent = cityName;
    document.getElementById('intel-coords').textContent = `${lat}° N, ${lon}° E`;
    document.getElementById('intel-aqi').textContent = cur.us_aqi ?? 'Normal';
    document.getElementById('intel-pm25').textContent = cur.pm2_5 ?? '—';
    document.getElementById('intel-pm10').textContent = cur.pm10 ?? '—';
    document.getElementById('intel-no2').textContent = cur.nitrogen_dioxide ?? '—';
    document.getElementById('intel-solar').textContent = (cur.direct_normal_irradiance ?? 0) + ' W/m²';
  } catch (_) {}
}

// 6. Launch Manifest (TheSpaceDevs LL2)
async function fetchLaunches() {
  const container = document.getElementById('launches-container');
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=6');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const launches = data.results || [];

    if (launches.length > 0) {
      const top = launches[0];
      document.getElementById('next-launch-name').textContent = top.name;
      document.getElementById('next-launch-desc').textContent = top.mission?.description || 'Orbital mission deployment.';
      document.getElementById('tag-provider').textContent = 'Provider: ' + (top.launch_service_provider?.name || 'Commercial');
      document.getElementById('tag-vehicle').textContent = 'Vehicle: ' + (top.rocket?.configuration?.name || 'Rocket');

      const diff = new Date(top.net) - new Date();
      const hrs = Math.max(0, Math.floor(diff / 3600000));
      const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
      document.getElementById('launch-countdown-val').textContent = `T-${hrs}h ${mins}m`;
      document.getElementById('launch-sub').textContent = top.name;
    }

    if (container) {
      container.innerHTML = launches.map(l => `
        <div class="apple-card">
          <div class="card-status-bar">
            <span class="apple-tag">${l.launch_service_provider?.name || 'Agency'}</span>
            <span class="apple-pill-status">${l.status?.name || 'Scheduled'}</span>
          </div>
          <h3 class="card-heading">${l.name}</h3>
          <p class="card-text">${l.mission?.description ? l.mission.description.slice(0, 140) + '...' : 'Launch manifest entry.'}</p>
          <div class="tag-cluster">
            <span class="apple-tag">Rocket: ${l.rocket?.configuration?.name || 'Rocket'}</span>
            <span class="apple-tag">Window: ${new Date(l.net).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      `).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = '<p class="card-text">Launch manifest currently offline.</p>';
  }
}

// 7. NASA DONKI Space Weather
async function fetchSpaceWeather() {
  const list = document.getElementById('solar-events-list');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const prev = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${prev}&endDate=${today}&api_key=DEMO_KEY`);
    if (!res.ok) throw new Error();
    const flares = await res.json();

    if (list) {
      if (flares.length === 0) {
        list.innerHTML = '<p class="card-text">No high-energy flares detected in past 7 days. Solar activity normal.</p>';
        return;
      }
      list.innerHTML = flares.slice(0, 8).map(f => `
        <div class="event-item">
          <div>
            <b>Solar Flare Class ${f.classType || 'Flare'}</b>
            <small>Peak: ${f.peakTime ? f.peakTime.replace('T', ' ').replace('Z', ' UTC') : 'Recorded'}</small>
          </div>
          <span class="event-badge orange">${f.classType || 'Flare'}</span>
        </div>
      `).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="card-text">DONKI telemetry updating…</p>';
  }
}

// 8. USGS Earthquakes
async function fetchEarthquakes() {
  const list = document.getElementById('quake-events-list');
  const countVal = document.getElementById('quake-count-val');
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const quakes = data.features || [];

    if (countVal) countVal.textContent = quakes.length;

    if (list) {
      list.innerHTML = quakes.slice(0, 10).map(q => {
        const mag = q.properties.mag.toFixed(1);
        const color = q.properties.mag >= 5.0 ? 'red' : (q.properties.mag >= 4.0 ? 'orange' : 'green');
        return `
          <a class="event-item" href="${q.properties.url}" target="_blank" rel="noopener">
            <div>
              <b>${q.properties.place}</b>
              <small>${new Date(q.properties.time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</small>
            </div>
            <span class="event-badge ${color}">M${mag}</span>
          </a>
        `;
      }).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="card-text">USGS network synchronizing…</p>';
  }
}

// 9. NASA APOD
async function fetchApod() {
  try {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!res.ok) return;
    const d = await res.json();

    document.getElementById('apod-preview-title').textContent = d.title;
    document.getElementById('apod-preview-desc').textContent = (d.explanation || '').slice(0, 120) + '...';

    const fullTitle = document.getElementById('apod-full-title');
    const media = document.getElementById('apod-media-container');
    const exp = document.getElementById('apod-explanation');
    const meta = document.getElementById('apod-meta');

    if (fullTitle) fullTitle.textContent = d.title;
    if (exp) exp.textContent = d.explanation;
    if (meta) meta.textContent = `${d.date} · ${d.copyright ? '© ' + d.copyright : 'NASA Observatory Public Stream'}`;

    if (media) {
      if (d.media_type === 'image') {
        media.innerHTML = `<img src="${d.url}" alt="${d.title}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;">`;
      } else {
        media.innerHTML = `<iframe src="${d.url}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:14px;"></iframe>`;
      }
    }
  } catch (_) {}
}

// 10. Wikimedia Encyclopedia API
async function searchWiki(query) {
  const container = document.getElementById('wiki-output-container');
  if (!container) return;
  container.innerHTML = '<div class="apple-spinner"></div>';
  try {
    const enc = encodeURIComponent(query.trim().replace(/ /g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    container.innerHTML = `
      <div style="margin-top:14px;border-top:0.5px solid var(--border-subtle);padding-top:14px;">
        <h4 style="font-size:16px;font-weight:700;margin-bottom:6px;">${data.title}</h4>
        <p style="font-size:12px;line-height:1.6;color:var(--text-muted);margin-bottom:12px;">${data.extract}</p>
        <a class="apple-btn-secondary" href="${data.content_urls?.desktop?.page || '#'}" target="_blank" rel="noopener">Open Wikimedia Article ↗</a>
      </div>
    `;
  } catch (_) {
    container.innerHTML = '<p class="card-text" style="margin-top:10px;">No exact article record found. Search another spacecraft or mission.</p>';
  }
}

// 11. Toast Notifications & Alert Simulator
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
  initMap();

  // Navigation
  document.querySelectorAll('[data-space]').forEach(btn => {
    btn.addEventListener('click', () => navigateToSpace(btn.getAttribute('data-space')));
  });

  const hash = window.location.hash.replace('#', '') || 'overview';
  navigateToSpace(hash);

  // Area Intel Chips
  document.querySelectorAll('.area-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.area-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      fetchAreaIntel(chip.getAttribute('data-lat'), chip.getAttribute('data-lon'), chip.getAttribute('data-name'));
    });
  });

  // Settings Sheet
  const modal = document.getElementById('settings-modal');
  document.getElementById('open-settings-btn')?.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('close-settings-btn')?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  // Test Alert
  document.getElementById('trigger-test-alert')?.addEventListener('click', async () => {
    const kpThreshold = document.getElementById('pref-solar-kp')?.value || '5';
    const quakeThreshold = document.getElementById('pref-quake-mag')?.value || '5.0';

    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('T&C Space Alert 🚀', {
        body: `Active filters: Solar Storm (Kp ${kpThreshold}+) | Earthquakes (M ${quakeThreshold}+). All systems operational.`,
        icon: 'assets/space-hub-icon-192.png?v=1'
      });
    }
    showToast(`Alert threshold saved: Kp ${kpThreshold}+ | M ${quakeThreshold}+`);
  });

  // Wikipedia search button
  document.getElementById('wiki-search-btn')?.addEventListener('click', () => {
    const q = document.getElementById('wiki-query-input')?.value;
    if (q) searchWiki(q);
  });

  // Refresh button
  document.getElementById('refresh-all-btn')?.addEventListener('click', () => {
    fetchLiveIss();
    fetchLaunches();
    fetchSpaceWeather();
    fetchEarthquakes();
    fetchApod();
    showToast('All planetary sensors refreshed.');
  });

  // Initial Fetches
  fetchLiveIss();
  fetchLaunches();
  fetchSpaceWeather();
  fetchEarthquakes();
  fetchApod();
  fetchAreaIntel('17.3850', '78.4867', 'Hyderabad, India');
  searchWiki('Chandrayaan-3');

  // Fast 3-second live ISS telemetry poll
  setInterval(fetchLiveIss, 3000);
});
