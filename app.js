// --- T&C Space Hub: 100% Real-Time Data Engine (HIG) ---

// 1. Navigation & Space Routing
function navigateToSpace(spaceId) {
  const views = document.querySelectorAll('.space-view');
  const navBtns = document.querySelectorAll('.nav-item, .dock-item');
  const titleEl = document.getElementById('page-title');

  const titles = {
    'overview': 'Mission Control',
    'orbital-map': 'Orbital Tracking',
    'launches': 'Launch Manifest',
    'planetary': 'Solar & Planetary',
    'cosmos': 'Cosmos & Intel'
  };

  views.forEach(v => {
    v.classList.remove('active');
    if (v.id === `view-${spaceId}`) v.classList.add('active');
  });

  navBtns.forEach(btn => {
    if (btn.getAttribute('data-space') === spaceId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (titleEl && titles[spaceId]) {
    titleEl.textContent = titles[spaceId];
  }

  window.location.hash = spaceId;
  if (spaceId === 'orbital-map' && satMap) {
    setTimeout(() => satMap.invalidateSize(), 200);
  }
}

// 2. Real-Time UTC Clock
function initClock() {
  const clockEl = document.getElementById('utc-clock');
  function tick() {
    const d = new Date();
    clockEl.textContent = d.toISOString().substring(11, 19) + ' UTC';
  }
  tick();
  setInterval(tick, 1000);
}

// 3. Leaflet Real-time Map
let satMap = null;
let issMarker = null;

function initMap() {
  const container = document.getElementById('sat-leaflet-map');
  if (!container || typeof L === 'undefined') return;

  satMap = L.map('sat-leaflet-map', { zoomControl: false }).setView([20, 0], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(satMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18,
    attribution: '© OpenStreetMap & CARTO'
  }).addTo(satMap);

  const satIcon = L.divIcon({
    className: 'leaflet-iss-icon',
    html: '<div style="width:14px;height:14px;background:#0A84FF;border:2.5px solid white;border-radius:50%;box-shadow:0 0 12px #0A84FF;"></div>',
    iconSize: [14, 14]
  });

  issMarker = L.marker([0, 0], { icon: satIcon }).addTo(satMap);
}

// 4. Live ISS Real-time Coordinates (WhereTheISS.at REST API)
async function fetchLiveIss() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) return;
    const data = await res.json();

    const alt = data.altitude.toFixed(1) + ' km';
    const vel = (data.velocity / 3600).toFixed(2) + ' km/s';
    const lat = data.latitude.toFixed(2) + '°';
    const lon = data.longitude.toFixed(2) + '°';

    const altVal = document.getElementById('iss-alt-val');
    const velVal = document.getElementById('iss-vel-val');
    if (altVal) altVal.textContent = alt;
    if (velVal) velVal.textContent = vel;

    document.getElementById('map-lat').textContent = lat;
    document.getElementById('map-lon').textContent = lon;
    document.getElementById('map-alt').textContent = alt;
    document.getElementById('map-spd').textContent = vel;

    if (issMarker && satMap) {
      issMarker.setLatLng([data.latitude, data.longitude]);
    }

    const ping = document.getElementById('last-ping');
    if (ping) ping.textContent = 'Live ping: ' + new Date().toLocaleTimeString();
  } catch (_) {}
}

// 5. Official Launch Manifest (TheSpaceDevs LL2)
async function fetchLaunches() {
  const container = document.getElementById('launches-list');
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=6');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const launches = data.results || [];

    if (launches.length > 0) {
      const top = launches[0];
      document.getElementById('next-launch-title').textContent = top.name;
      document.getElementById('next-launch-desc').textContent = top.mission?.description || 'Orbital payload deployment.';
      document.getElementById('next-launch-pad').textContent = 'Pad: ' + (top.pad?.location?.name || 'Spaceport');
      document.getElementById('next-launch-vehicle').textContent = 'Vehicle: ' + (top.rocket?.configuration?.name || 'Rocket');
      document.getElementById('launch-provider-label').textContent = top.launch_service_provider?.name || 'Commercial';

      const diff = new Date(top.net) - new Date();
      const hrs = Math.max(0, Math.floor(diff / 3600000));
      const mins = Math.max(0, Math.floor((diff % 3600000) / 60000));
      document.getElementById('launch-countdown-val').textContent = `T-${hrs}h ${mins}m`;
    }

    if (container) {
      container.innerHTML = launches.map(l => `
        <div class="apple-card">
          <div class="card-top-row">
            <span class="apple-tag">${l.launch_service_provider?.name || 'Agency'}</span>
            <span class="apple-status-badge">${l.status?.name || 'Scheduled'}</span>
          </div>
          <h3 class="card-title">${l.name}</h3>
          <p class="card-description">${l.mission?.description ? l.mission.description.slice(0, 140) + '...' : 'Orbital flight manifest.'}</p>
          <div class="tag-row">
            <span class="apple-tag">Rocket: ${l.rocket?.configuration?.name || 'Rocket'}</span>
            <span class="apple-tag">NET: ${new Date(l.net).toUTCString().slice(0, 22)}</span>
          </div>
        </div>
      `).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = '<p class="card-description">Live launch schedule temporarily offline.</p>';
  }
}

// 6. NASA DONKI Space Weather
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
        list.innerHTML = '<p class="card-description">No severe solar flares registered in past 7 days. Solar disk quiet.</p>';
        return;
      }
      list.innerHTML = flares.slice(0, 8).map(f => `
        <div class="event-item">
          <div>
            <b>Solar Flare Class ${f.classType || 'N/A'}</b>
            <small>Peak: ${f.peakTime ? f.peakTime.replace('T', ' ').replace('Z', '') : 'Recorded'}</small>
          </div>
          <span class="event-badge orange">${f.classType || 'Flare'}</span>
        </div>
      `).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="card-description">NASA DONKI feed temporarily offline.</p>';
  }
}

// 7. USGS Earthquakes
async function fetchEarthquakes() {
  const list = document.getElementById('earthquake-events-list');
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
              <small>${new Date(q.properties.time).toUTCString().slice(0, 22)}</small>
            </div>
            <span class="event-badge ${color}">M${mag}</span>
          </a>
        `;
      }).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="card-description">USGS seismic sensors updating…</p>';
  }
}

// 8. NASA APOD (Astronomy Picture of the Day)
async function fetchApod() {
  try {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!res.ok) return;
    const data = await res.json();

    document.getElementById('apod-mini-title').textContent = data.title;
    document.getElementById('apod-mini-desc').textContent = (data.explanation || '').slice(0, 120) + '...';

    const fullTitle = document.getElementById('apod-full-title');
    const media = document.getElementById('apod-media-container');
    const exp = document.getElementById('apod-full-explanation');
    const meta = document.getElementById('apod-meta');

    if (fullTitle) fullTitle.textContent = data.title;
    if (exp) exp.textContent = data.explanation;
    if (meta) meta.textContent = `${data.date} · ${data.copyright ? '© ' + data.copyright : 'NASA Public Domain'}`;

    if (media) {
      if (data.media_type === 'image') {
        media.innerHTML = `<img src="${data.url}" alt="${data.title}">`;
      } else {
        media.innerHTML = `<iframe src="${data.url}" frameborder="0" allowfullscreen></iframe>`;
      }
    }
  } catch (_) {}
}

// 9. Wikipedia Live REST API
async function searchWiki(query) {
  const output = document.getElementById('wiki-output-box');
  if (!output) return;
  output.innerHTML = '<span class="apple-spinner"></span>';
  try {
    const enc = encodeURIComponent(query.trim().replace(/ /g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    output.innerHTML = `
      <div style="margin-top:14px;border-top:0.5px solid var(--border-subtle);padding-top:14px;">
        <h4 style="font-size:16px;font-weight:700;margin-bottom:6px;">${data.title}</h4>
        <p style="font-size:12px;line-height:1.6;color:var(--text-secondary);margin-bottom:10px;">${data.extract}</p>
        <a class="apple-secondary-btn" href="${data.content_urls?.desktop?.page || '#'}" target="_blank" rel="noopener">Open Wikipedia Entry ↗</a>
      </div>
    `;
  } catch (_) {
    output.innerHTML = '<p class="card-description" style="margin-top:10px;">No exact encyclopedia article found. Try another term.</p>';
  }
}

// 10. Apple Toast Notification
function showToast(text) {
  const toast = document.getElementById('toast-message');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);
}

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initMap();

  // Navigation click listeners
  document.querySelectorAll('[data-space]').forEach(btn => {
    btn.addEventListener('click', () => {
      const space = btn.getAttribute('data-space');
      navigateToSpace(space);
    });
  });

  const hash = window.location.hash.replace('#', '') || 'overview';
  navigateToSpace(hash);

  // Settings Modal controls
  const modal = document.getElementById('settings-modal');
  document.getElementById('open-settings-btn')?.addEventListener('click', () => modal.classList.add('open'));
  document.getElementById('close-settings-btn')?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  // Theme Switcher
  document.querySelectorAll('#theme-switcher .segment').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#theme-switcher .segment').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-theme-val');
      if (val === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', val);
      }
    });
  });

  // Wikipedia Search trigger
  document.getElementById('wiki-search-trigger')?.addEventListener('click', () => {
    const q = document.getElementById('wiki-input')?.value;
    if (q) searchWiki(q);
  });

  // Test Notification
  document.getElementById('test-alert-btn')?.addEventListener('click', () => {
    showToast('T&C Space Alert: ISS orbital pass in tracking range.');
  });

  // Refresh feeds
  document.getElementById('refresh-data-btn')?.addEventListener('click', () => {
    fetchLiveIss();
    fetchLaunches();
    fetchSpaceWeather();
    fetchEarthquakes();
    fetchApod();
    showToast('Telemetry refreshed from official endpoints.');
  });

  // Initial Fetch & 3-second live ISS loop
  fetchLiveIss();
  fetchLaunches();
  fetchSpaceWeather();
  fetchEarthquakes();
  fetchApod();
  searchWiki('James Webb Space Telescope');

  setInterval(fetchLiveIss, 3000);
});
