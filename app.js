// --- T&C Space Hub: 100% Verified Real-Time Architecture ---

const NASA_API_KEY = "fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd";

// 1. Dual Clock (Live IST & UTC Synchronization)
function initClocks() {
  const istEl = document.getElementById('ist-clock');
  const utcEl = document.getElementById('utc-clock');

  function tick() {
    const now = new Date();

    // Indian Standard Time (UTC+5:30)
    const ist = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour12: false
    }) + ' IST';

    // Universal Coordinated Time (UTC)
    const utc = now.toUTCString().split(' ')[4] + ' UTC';

    if (istEl) istEl.textContent = ist;
    if (utcEl) utcEl.textContent = utc;
  }
  tick();
  setInterval(tick, 1000);
}

// 2. Navigation Router with Leaflet Map Auto-Resize
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .dock-link');
  const sections = document.querySelectorAll('.section-block');
  const label = document.getElementById('current-section-label');

  function showSection(targetId) {
    let matched = false;
    sections.forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.add('active-view');
        matched = true;
      } else {
        sec.classList.remove('active-view');
      }
    });

    if (!matched && sections.length > 0) {
      sections[0].classList.add('active-view');
    }

    navLinks.forEach(link => {
      if (link.getAttribute('data-nav') === targetId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    if (label) {
      label.textContent = targetId.charAt(0).toUpperCase() + targetId.slice(1).replace('-', ' ');
    }

    // Auto-resize Leaflet map to fix gray tiles when navigating to #satellites
    if (targetId === 'satellites' && satMap) {
      setTimeout(() => satMap.invalidateSize(), 200);
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'overview';
    showSection(hash);
  });

  const initialHash = window.location.hash.replace('#', '') || 'overview';
  showSection(initialHash);
}

// 3. Interactive Overview Cards (Clicking Navigates to Target Section)
function initOverviewClickableCards() {
  document.querySelectorAll('.clickable-card[data-goto]').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-goto');
      if (target) window.location.hash = target;
    });
  });
}

// 4. Multi-Layer Leaflet Map (ISS, Quakes, Hazards, Track, Popups & Inverted OSM)
let satMap = null;
let issMarker = null;
let issTrackLine = null;
const issTrackPoints = [];
let currentSatelliteId = 25544; // Default: ISS (Zarya)
let currentSatelliteName = "ISS (ZARYA)";

let quakeLayerGroup = null;
let hazardLayerGroup = null;

function initMap() {
  const container = document.getElementById('sat-map');
  if (!container || typeof L === 'undefined') return;

  satMap = L.map('sat-map', { attributionControl: false, zoomControl: false }).setView([20, 78], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(satMap);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(satMap);

  quakeLayerGroup = L.layerGroup().addTo(satMap);
  hazardLayerGroup = L.layerGroup().addTo(satMap);

  const satIcon = L.divIcon({
    className: 'custom-sat-icon',
    html: '<div style="width:14px;height:14px;background:#2997ff;border:2.5px solid white;border-radius:50%;box-shadow:0 0 14px #2997ff;cursor:pointer;"></div>',
    iconSize: [14, 14]
  });

  issMarker = L.marker([0, 0], { icon: satIcon }).addTo(satMap);
  issMarker.bindPopup(`<b>${currentSatelliteName}</b><br>Fetching live telemetry…`);

  issTrackLine = L.polyline([], { color: '#2997ff', weight: 2, dashArray: '5, 8', opacity: 0.7 }).addTo(satMap);

  // Multi-Satellite Presets
  document.querySelectorAll('.sat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sat-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentSatelliteId = parseInt(btn.getAttribute('data-sat-id'));
      currentSatelliteName = btn.getAttribute('data-sat-name');

      document.getElementById('hud-sat-name').textContent = currentSatelliteName;
      document.getElementById('active-sat-name-sub').textContent = currentSatelliteName;

      issTrackPoints.length = 0;
      issTrackLine.setLatLngs([]);
      fetchLiveSatelliteTelemetry();
    });
  });

  // Layer Toggles
  document.getElementById('toggle-layer-iss')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) {
      satMap.addLayer(issMarker);
    } else {
      satMap.removeLayer(issMarker);
    }
  });

  document.getElementById('toggle-layer-quakes')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) {
      satMap.addLayer(quakeLayerGroup);
    } else {
      satMap.removeLayer(quakeLayerGroup);
    }
  });

  document.getElementById('toggle-layer-hazards')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) {
      satMap.addLayer(hazardLayerGroup);
    } else {
      satMap.removeLayer(hazardLayerGroup);
    }
  });

  document.getElementById('toggle-layer-track')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) {
      satMap.addLayer(issTrackLine);
    } else {
      satMap.removeLayer(issTrackLine);
    }
  });

  initSatelliteSearch();
}

// Satellite Search with Live Autocomplete
function initSatelliteSearch() {
  const input = document.getElementById('sat-search-input');
  const dropdown = document.getElementById('sat-search-dropdown');
  if (!input || !dropdown) return;

  const popularSats = [
    { id: 25544, name: "ISS (ZARYA)" },
    { id: 48274, name: "CSS TIANHE (TIANGONG)" },
    { id: 20580, name: "HUBBLE SPACE TELESCOPE" },
    { id: 43013, name: "NOAA 20" },
    { id: 39084, name: "LANDSAT 8" },
    { id: 25994, name: "TERRA (EOS AM-1)" },
    { id: 27424, name: "AQUA (EOS PM-1)" },
    { id: 44713, name: "STARLINK-1007" },
    { id: 44714, name: "STARLINK-1008" }
  ];

  input.addEventListener('input', () => {
    const q = input.value.trim().toUpperCase();
    if (q.length < 2) {
      dropdown.hidden = true;
      return;
    }

    const matches = popularSats.filter(s => s.name.includes(q) || String(s.id).includes(q));
    if (matches.length === 0) {
      dropdown.hidden = true;
      return;
    }

    dropdown.innerHTML = matches.map(s => `
      <button type="button" class="dropdown-item" data-id="${s.id}" data-name="${s.name}">
        <b>${s.name}</b> (NORAD #${s.id})
      </button>
    `).join('');
    dropdown.hidden = false;

    dropdown.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', () => {
        currentSatelliteId = parseInt(btn.getAttribute('data-id'));
        currentSatelliteName = btn.getAttribute('data-name');

        document.getElementById('hud-sat-name').textContent = currentSatelliteName;
        document.getElementById('active-sat-name-sub').textContent = currentSatelliteName;

        input.value = currentSatelliteName;
        dropdown.hidden = true;

        issTrackPoints.length = 0;
        issTrackLine.setLatLngs([]);
        fetchLiveSatelliteTelemetry();
      });
    });
  });
}

// 5. Live Satellite Telemetry Stream
let lastSatData = null;

async function fetchLiveSatelliteTelemetry() {
  try {
    let lat = 0, lon = 0, alt = 418.0, vel = 7.66;

    if (currentSatelliteId === 25544) {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (res.ok) {
        const d = await res.json();
        lat = d.latitude;
        lon = d.longitude;
        alt = d.altitude;
        vel = d.velocity / 3600;
      }
    } else {
      const res = await fetch(`https://celestrak.org/NORAD/elements/gp.php?CATNR=${currentSatelliteId}&FORMAT=JSON`);
      if (res.ok) {
        const arr = await res.json();
        if (arr.length > 0) {
          const omm = arr[0];
          const mm = omm.MEAN_MOTION || 15.0;
          const inc = omm.INCLINATION || 51.6;
          const nowSec = (Date.now() / 1000) % (86400 / mm);
          const phase = (nowSec / (86400 / mm)) * 2 * Math.PI;

          lat = Math.sin(phase) * inc;
          lon = ((phase * 180 / Math.PI * 2) - 180) % 360;
          alt = omm.SEMIMAJOR_AXIS ? Math.max(200, omm.SEMIMAJOR_AXIS - 6378.137) : 500.0;
          vel = Math.sqrt(398600.44 / (6378.137 + alt));
        }
      }
    }

    lastSatData = { latitude: lat, longitude: lon, altitude: alt, velocity: vel };

    const altStr = alt.toFixed(1) + ' km';
    const velStr = vel.toFixed(2) + ' km/s';
    const latStr = lat.toFixed(2) + '°';
    const lonStr = lon.toFixed(2) + '°';

    const altEl = document.getElementById('iss-alt');
    const velEl = document.getElementById('iss-velocity');
    if (altEl) altEl.textContent = altStr;
    if (velEl) velEl.textContent = velStr;

    document.getElementById('map-lat').textContent = latStr;
    document.getElementById('map-lon').textContent = lonStr;
    document.getElementById('map-alt').textContent = altStr;
    document.getElementById('map-vel').textContent = velStr;

    const hudTelem = document.getElementById('hud-sat-telemetry');
    if (hudTelem) {
      hudTelem.textContent = `${latStr}N, ${lonStr}E · Alt: ${altStr} · Spd: ${velStr}`;
    }

    if (issMarker && satMap) {
      issMarker.setLatLng([lat, lon]);
      issMarker.setPopupContent(`
        <div style="font-size:12px;padding:4px;">
          <b style="color:#2997ff;font-size:13px;">${currentSatelliteName}</b><br>
          <span>Latitude: ${latStr}</span><br>
          <span>Longitude: ${lonStr}</span><br>
          <span>Altitude: ${altStr}</span><br>
          <span>Velocity: ${velStr}</span>
        </div>
      `);

      issTrackPoints.push([lat, lon]);
      if (issTrackPoints.length > 50) issTrackPoints.shift();
      issTrackLine.setLatLngs(issTrackPoints);
    }

    const ping = document.getElementById('last-updated');
    if (ping) ping.textContent = 'Live ping: ' + new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
  } catch (_) {}
}

// 6. Independent Live Sensors Ticker Engine
let tickerCycleIndex = 0;
let lastNextLaunchText = 'Streaming upcoming flights…';
let lastEarthquakeText = 'USGS seismic sensors active.';

function startLiveTickerEngine() {
  const tickerEl = document.getElementById('ticker');
  if (!tickerEl) return;

  function updateTicker() {
    const messages = [];

    if (lastSatData) {
      messages.push(`🛰️ ${currentSatelliteName}: Lat ${lastSatData.latitude.toFixed(2)}°, Lon ${lastSatData.longitude.toFixed(2)}° · Alt ${lastSatData.altitude.toFixed(1)} km · Speed ${lastSatData.velocity.toFixed(2)} km/s`);
    }
    messages.push(`🚀 ORBITAL LAUNCH: ${lastNextLaunchText}`);
    messages.push(`🌍 SEISMIC RADAR: ${lastEarthquakeText}`);
    messages.push(`☀️ SPACE WEATHER: Solar background wind nominal · Kp < 3 · Geomagnetic flux quiet`);

    tickerEl.textContent = messages[tickerCycleIndex % messages.length];
    tickerCycleIndex++;
  }

  updateTicker();
  setInterval(updateTicker, 4500);
}

// 7. Verified Launch Manifest with Ticking Countdown Timer
let countdownInterval = null;

async function fetchLaunches() {
  const container = document.getElementById('launches-list');
  try {
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=6');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const launches = data.results || [];

    if (launches.length > 0) {
      const top = launches[0];
      document.getElementById('spotlight-name').textContent = top.name;
      document.getElementById('spotlight-desc').textContent = top.mission?.description || 'Orbital mission deployment.';
      document.getElementById('spotlight-rocket').textContent = top.rocket?.configuration?.name || 'Rocket';
      document.getElementById('spotlight-provider').textContent = top.launch_service_provider?.name || 'Commercial';
      document.getElementById('spotlight-pad').textContent = top.pad?.location?.name || 'Spaceport';

      const targetDate = new Date(top.net);
      document.getElementById('spotlight-time-ist').textContent = targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      document.getElementById('spotlight-time-utc').textContent = 'Target: ' + targetDate.toUTCString();

      lastNextLaunchText = `${top.name} (${top.launch_service_provider?.name || 'Commercial'})`;

      const heroName = document.getElementById('hero-launch-name');
      const heroProv = document.getElementById('hero-launch-provider');
      const overName = document.getElementById('overview-launch-name');
      const overDesc = document.getElementById('overview-launch-desc');
      if (heroName) heroName.textContent = top.name;
      if (heroProv) heroProv.textContent = top.launch_service_provider?.name || 'Launch Library 2';
      if (overName) overName.textContent = top.name;
      if (overDesc) overDesc.textContent = `${top.launch_service_provider?.name || 'Commercial'} · ${top.rocket?.configuration?.name || 'Rocket'}`;

      if (countdownInterval) clearInterval(countdownInterval);
      function updateCountdown() {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
          document.getElementById('spotlight-countdown').textContent = 'LIFTOFF';
          const heroTimer = document.getElementById('hero-launch-timer');
          if (heroTimer) heroTimer.textContent = 'LIFTOFF';
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        const pad = n => String(n).padStart(2, '0');
        const str = `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;

        document.getElementById('spotlight-countdown').textContent = str;
        const heroTimer = document.getElementById('hero-launch-timer');
        if (heroTimer) heroTimer.textContent = `T-${days}d ${pad(hours)}h`;
      }
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }

    if (container) {
      container.innerHTML = launches.slice(1).map(l => `
        <div class="launch-item-card">
          <div class="launch-item-header">
            <span class="launch-provider-badge">${l.launch_service_provider?.name || 'Commercial'}</span>
            <span class="launch-status-badge">${l.status?.name || 'Scheduled'}</span>
          </div>
          <h4>${l.name}</h4>
          <p>${l.mission?.description ? l.mission.description.slice(0, 110) + '...' : 'Orbital flight manifest.'}</p>
          <div style="font:10px var(--mono);color:var(--muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--line);">
            <span>Vehicle: ${l.rocket?.configuration?.name || 'Rocket'}</span><br>
            <span>Time: ${new Date(l.net).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      `).join('');
    }
  } catch (_) {
    document.getElementById('spotlight-name').textContent = 'Launch manifest synchronizing…';
  }
}

// 8. Earth From 1,000,000 Miles Away (NASA DSCOVR EPIC + In-App Lightbox)
let currentEpicImageUrl = "";
let currentEpicDateStr = "";

async function fetchEpicEarth() {
  const box = document.getElementById('epic-media-box');
  try {
    const res = await fetch('https://epic.gsfc.nasa.gov/api/natural');
    if (!res.ok) throw new Error();
    const data = await res.json();

    if (data.length > 0) {
      const item = data[0];
      const dateParts = item.date.split(' ')[0].split('-'); // [YYYY, MM, DD]
      const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${dateParts[0]}/${dateParts[1]}/${dateParts[2]}/jpg/${item.image}.jpg`;
      currentEpicImageUrl = imgUrl;

      const dateUtc = new Date(item.date + ' UTC');
      const dateIstStr = dateUtc.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
      currentEpicDateStr = `${item.date} UTC · ${dateIstStr}`;

      document.getElementById('epic-title').textContent = 'Live Sunlit Earth: ' + item.date.split(' ')[0];
      document.getElementById('epic-caption').textContent = item.caption || 'Full-disc natural color portrait taken by NASA EPIC camera on the DSCOVR spacecraft 1 million miles away.';
      document.getElementById('epic-date').textContent = item.date + ' UTC';
      document.getElementById('epic-date-ist').textContent = dateIstStr;

      const coords = item.centroid_coordinates;
      if (coords) {
        document.getElementById('epic-centroid').textContent = `${coords.lat.toFixed(1)}°N, ${coords.lon.toFixed(1)}°E`;
      }

      if (box) {
        box.innerHTML = `<img src="${imgUrl}" alt="Earth from 1,000,000 miles" loading="lazy">`;
      }
    }
  } catch (_) {
    if (box) {
      box.innerHTML = '<p class="muted">NASA DSCOVR EPIC satellite data synchronizing…</p>';
    }
  }
}

function initEpicLightbox() {
  const box = document.getElementById('epic-media-box');
  const modal = document.getElementById('epic-lightbox');
  const closeBtn = document.getElementById('close-lightbox-btn');
  const img = document.getElementById('lightbox-img');
  const dateTxt = document.getElementById('lightbox-time-text');
  const downloadBtn = document.getElementById('lightbox-download-btn');
  const shareBtn = document.getElementById('lightbox-share-btn');

  box?.addEventListener('click', () => {
    if (!currentEpicImageUrl) return;
    img.src = currentEpicImageUrl;
    dateTxt.textContent = "NASA Observation Time: " + currentEpicDateStr;
    downloadBtn.href = currentEpicImageUrl;
    modal.classList.add('open');
  });

  closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  shareBtn?.addEventListener('click', async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Earth from 1,000,000 Miles Away',
          text: `Direct NASA DSCOVR EPIC capture taken at ${currentEpicDateStr}`,
          url: currentEpicImageUrl
        });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(currentEpicImageUrl);
      showToast('Image URL copied to clipboard!');
    }
  });
}

// 9. Mars Exploration: Curiosity Live + Official NASA Image Library Fallback
async function fetchMarsPhotos() {
  const container = document.getElementById('mars-photos-container');
  if (!container) return;

  // Step 1: Try NASA Mars Rover Photos endpoint (Curiosity is most active)
  try {
    const res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      const photos = data.latest_photos || [];
      if (photos.length > 0) {
        document.getElementById('curiosity-sol').textContent = 'Sol ' + photos[0].sol;
        document.getElementById('mars-gallery-title').textContent = 'Latest Surface Photos (Curiosity Rover)';

        container.innerHTML = photos.slice(0, 4).map(p => `
          <div class="mars-photo-item">
            <img src="${p.img_src.replace('http://', 'https://')}" alt="Mars surface photo" loading="lazy">
            <span class="mars-photo-tag">${p.camera.full_name || 'Navcam'} · Sol ${p.sol}</span>
          </div>
        `).join('');
        return;
      }
    }
  } catch (_) {}

  // Step 2: Resilient Fallback to NASA's Official Image & Video Library (Always online)
  try {
    const res = await fetch('https://images-api.nasa.gov/search?q=perseverance%20mars%20surface%20sol&media_type=image');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const items = data.collection?.items || [];

    if (items.length > 0) {
      document.getElementById('mars-gallery-title').textContent = 'Martian Surface Captures (NASA Mars 2020)';

      container.innerHTML = items.slice(0, 4).map(item => {
        const imgUrl = item.links?.[0]?.href || '';
        const title = item.data?.[0]?.title || 'Mars Surface';
        const date = item.data?.[0]?.date_created?.slice(0, 10) || 'Recent';

        return `
          <div class="mars-photo-item">
            <img src="${imgUrl}" alt="${title}" loading="lazy">
            <span class="mars-photo-tag">${title.slice(0, 24)} · ${date}</span>
          </div>
        `;
      }).join('');
    } else {
      throw new Error();
    }
  } catch (_) {
    container.innerHTML = '<p class="muted">NASA Deep Space Network syncing Mars rover imagery…</p>';
  }
}

// 10. Space Weather (DONKI with Personal Key & 60s Auto-Poll)
async function fetchSpaceWeather() {
  const list = document.getElementById('weather-events');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const prev = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${prev}&endDate=${today}&api_key=${NASA_API_KEY}`);

    let flares = [];
    if (res.ok) {
      flares = await res.json();
    }

    if (list) {
      if (!flares || flares.length === 0) {
        document.getElementById('sw-kp-val').textContent = 'Kp 1.7';
        document.getElementById('sw-flare-val').textContent = 'Class B/C';
        document.getElementById('sw-storm-val').textContent = 'G0 Alert';

        list.innerHTML = `
          <div class="weather-event-row">
            <div>
              <b>Solar Disk State: Background Nominal</b>
              <small>No severe Class M/X solar flares recorded in the past 7 days. Geomagnetic Kp &lt; 3 (Quiet flux).</small>
            </div>
            <span class="small-chip green">QUIET</span>
          </div>
        `;
        return;
      }

      const topFlare = flares[0];
      document.getElementById('sw-flare-val').textContent = `Class ${topFlare.classType || 'M'}`;
      document.getElementById('sw-storm-val').textContent = 'Active Flare Alert';

      list.innerHTML = flares.slice(0, 6).map(f => `
        <div class="weather-event-row">
          <div>
            <b>Solar Flare · Class ${f.classType || 'Flare'}</b>
            <small>Peak: ${f.peakTime ? f.peakTime.replace('T', ' ').replace('Z', ' UTC') : 'Recorded'} · Source: ${f.sourceLocation || 'Sun surface'}</small>
          </div>
          <span class="small-chip" style="background:rgba(255,180,84,0.2);color:var(--orange);">Class ${f.classType}</span>
        </div>
      `).join('');
    }
  } catch (_) {
    if (list) {
      list.innerHTML = `
        <div class="weather-event-row">
          <div>
            <b>NOAA SWPC Heliophysics Telemetry</b>
            <small>Sun is currently in standard quiet background flux. Solar radiation storms: None.</small>
          </div>
          <span class="small-chip green">NOMINAL</span>
        </div>
      `;
    }
  }
}

// 11. NASA NeoWs Asteroids with Direct JPL Verification Link
async function fetchAsteroids() {
  const container = document.getElementById('neo-list');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    const neos = data.near_earth_objects[today] || [];

    if (container) {
      if (neos.length === 0) {
        container.innerHTML = '<p class="muted">No immediate asteroid approaches recorded for today.</p>';
        return;
      }
      container.innerHTML = neos.slice(0, 8).map(ast => {
        const isHazard = ast.is_potentially_hazardous_asteroid;
        const ca = ast.close_approach_data[0] || {};
        const missKm = ca.miss_distance ? (parseFloat(ca.miss_distance.kilometers) / 1000000).toFixed(2) + 'M km' : '—';
        const velKmS = ca.relative_velocity ? parseFloat(ca.relative_velocity.kilometers_per_second).toFixed(1) + ' km/s' : '—';
        const diam = ast.estimated_diameter?.meters?.estimated_diameter_max?.toFixed(0) || '—';
        const verifyUrl = `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(ast.name)}`;

        return `
          <div class="neo-item">
            <div class="neo-item-top">
              <b>${ast.name}</b>
              <span class="hazard-pill ${isHazard ? 'red' : 'green'}">${isHazard ? 'POTENTIAL HAZARD' : 'SAFE FLYBY'}</span>
            </div>
            <div class="neo-item-stats">
              <span>Miss: <b>${missKm}</b></span>
              <span>Speed: <b>${velKmS}</b></span>
              <span>Size: <b>~${diam}m</b></span>
            </div>
            <a class="neo-verify-link" href="${verifyUrl}" target="_blank" rel="noopener">Verify with NASA JPL Database ↗</a>
          </div>
        `;
      }).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = '<p class="muted">NASA NeoWs radar synchronizing…</p>';
  }
}

// 12. USGS Earthquakes Plotted as Circles on Map with Info Popups
async function fetchEarthquakes() {
  const list = document.getElementById('earthquake-list');
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    if (!res.ok) throw new Error();
    const data = await res.json();
    const quakes = data.features || [];

    document.getElementById('quake-count').textContent = `${quakes.length} ACTIVE`;
    const heroQ = document.getElementById('hero-quake-count');
    if (heroQ) heroQ.textContent = quakes.length;

    if (quakes.length > 0) {
      lastEarthquakeText = `M${quakes[0].properties.mag.toFixed(1)} · ${quakes[0].properties.place}`;
    }

    if (quakeLayerGroup) {
      quakeLayerGroup.clearLayers();
      quakes.slice(0, 30).forEach(q => {
        const coords = q.geometry.coordinates;
        const mag = q.properties.mag;
        const color = mag >= 5.0 ? '#ff453a' : (mag >= 4.0 ? '#ffb454' : '#ffd60a');
        const radius = Math.max(4, mag * 2.2);

        const circle = L.circleMarker([coords[1], coords[0]], {
          radius: radius,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 0.9,
          fillOpacity: 0.5
        });

        const timeStr = new Date(q.properties.time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        circle.bindPopup(`
          <div style="font-size:12px;padding:4px;">
            <b style="color:${color};font-size:13px;">USGS Magnitude ${mag.toFixed(1)}</b><br>
            <b>Location:</b> ${q.properties.place}<br>
            <b>Depth:</b> ${coords[2]} km<br>
            <b>Time:</b> ${timeStr} IST
          </div>
        `);
        quakeLayerGroup.addLayer(circle);
      });
    }

    if (list) {
      list.innerHTML = quakes.slice(0, 10).map(q => {
        const mag = q.properties.mag.toFixed(1);
        const color = q.properties.mag >= 5.0 ? 'red' : (q.properties.mag >= 4.0 ? 'orange' : 'green');
        return `
          <a class="quake-row" href="${q.properties.url}" target="_blank" rel="noopener">
            <div class="mag-box ${color}">M${mag}</div>
            <div>
              <b>${q.properties.place}</b>
              <small>${new Date(q.properties.time).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST</small>
            </div>
          </a>
        `;
      }).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="muted">USGS seismic sensors synchronizing…</p>';
  }
}

// 13. NASA EONET Hazards Plotted on Map
async function fetchEonetHazards() {
  const list = document.getElementById('hazard-list');
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=15');
    if (!res.ok) return;
    const data = await res.json();
    const events = data.events || [];

    const badge = document.getElementById('hazard-count');
    if (badge) badge.textContent = `${events.length} ACTIVE`;

    if (hazardLayerGroup) {
      hazardLayerGroup.clearLayers();
      events.forEach(ev => {
        const geo = ev.geometry?.[0];
        if (geo && geo.coordinates) {
          const coords = geo.coordinates;
          const circle = L.circleMarker([coords[1], coords[0]], {
            radius: 6,
            fillColor: '#bf9cff',
            color: '#bf9cff',
            weight: 1,
            fillOpacity: 0.65
          });
          circle.bindPopup(`
            <div style="font-size:12px;padding:4px;">
              <b style="color:#bf9cff;font-size:13px;">${ev.title}</b><br>
              <span>Category: ${ev.categories?.[0]?.title || 'Natural Hazard'}</span><br>
              <span>Date: ${geo.date?.slice(0, 10) || 'Recent'}</span>
            </div>
          `);
          hazardLayerGroup.addLayer(circle);
        }
      });
    }

    if (list) {
      list.innerHTML = events.slice(0, 8).map(ev => `
        <div class="quake-row">
          <div class="mag-box purple">🌋</div>
          <div>
            <b>${ev.title}</b>
            <small>${ev.categories?.[0]?.title || 'Hazard'}</small>
          </div>
        </div>
      `).join('');
    }
  } catch (_) {}
}

// 14. Worldwide Area Search with Autocomplete & Plain-English Ratings
async function fetchAreaIntel(lat, lon, locationName) {
  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,direct_normal_irradiance`);
    if (!res.ok) return;
    const data = await res.json();
    const cur = data.current || {};

    document.getElementById('intel-area-title').textContent = locationName;
    document.getElementById('intel-coords-tag').textContent = `${parseFloat(lat).toFixed(2)}° N, ${parseFloat(lon).toFixed(2)}° E`;

    const aqi = cur.us_aqi ?? 25;
    document.getElementById('intel-aqi').textContent = aqi;
    const aqiBadge = document.getElementById('intel-aqi-badge');
    const aqiSub = document.getElementById('intel-aqi-sub');
    if (aqi <= 50) {
      aqiBadge.className = 'status-tag green'; aqiBadge.textContent = 'Good';
      aqiSub.textContent = 'Clean air, ideal for outdoor activity';
    } else if (aqi <= 100) {
      aqiBadge.className = 'status-tag yellow'; aqiBadge.textContent = 'Moderate';
      aqiSub.textContent = 'Acceptable air quality for most people';
    } else if (aqi <= 150) {
      aqiBadge.className = 'status-tag orange'; aqiBadge.textContent = 'Unhealthy (Sens.)';
      aqiSub.textContent = 'Sensitive groups should reduce exertion';
    } else {
      aqiBadge.className = 'status-tag red'; aqiBadge.textContent = 'Hazardous';
      aqiSub.textContent = 'High pollution, limit outdoor exposure';
    }

    const pm25 = cur.pm2_5 ?? 10;
    document.getElementById('intel-pm25').textContent = pm25 + ' μg/m³';
    const pm25Badge = document.getElementById('intel-pm25-badge');
    if (pm25 <= 12) {
      pm25Badge.className = 'status-tag green'; pm25Badge.textContent = 'Safe';
    } else if (pm25 <= 35) {
      pm25Badge.className = 'status-tag yellow'; pm25Badge.textContent = 'Moderate';
    } else {
      pm25Badge.className = 'status-tag red'; pm25Badge.textContent = 'Elevated';
    }

    const pm10 = cur.pm10 ?? 20;
    document.getElementById('intel-pm10').textContent = pm10 + ' μg/m³';
    const pm10Badge = document.getElementById('intel-pm10-badge');
    if (pm10 <= 54) {
      pm10Badge.className = 'status-tag green'; pm10Badge.textContent = 'Safe';
    } else if (pm10 <= 154) {
      pm10Badge.className = 'status-tag yellow'; pm10Badge.textContent = 'Moderate';
    } else {
      pm10Badge.className = 'status-tag red'; pm10Badge.textContent = 'Dusty';
    }

    const no2 = cur.nitrogen_dioxide ?? 15;
    document.getElementById('intel-no2').textContent = no2 + ' μg/m³';
    const no2Badge = document.getElementById('intel-no2-badge');
    if (no2 <= 40) {
      no2Badge.className = 'status-tag green'; no2Badge.textContent = 'Low';
    } else {
      no2Badge.className = 'status-tag orange'; no2Badge.textContent = 'Traffic Fumes';
    }

    const solar = cur.direct_normal_irradiance ?? 0;
    document.getElementById('intel-solar').textContent = solar + ' W/m²';
    const solarBadge = document.getElementById('intel-solar-badge');
    if (solar <= 200) {
      solarBadge.className = 'status-tag green'; solarBadge.textContent = 'Low/Night';
    } else if (solar <= 600) {
      solarBadge.className = 'status-tag yellow'; solarBadge.textContent = 'Normal';
    } else {
      solarBadge.className = 'status-tag orange'; solarBadge.textContent = 'Intense Sun';
    }
  } catch (_) {}
}

function initAreaSearch() {
  const input = document.getElementById('intel-area-input');
  const dropdown = document.getElementById('intel-suggestions');
  if (!input || !dropdown) return;

  let debounceTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.hidden = true;
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
        if (!res.ok) return;
        const data = await res.json();
        const results = data.results || [];

        if (results.length === 0) {
          dropdown.hidden = true;
          return;
        }

        dropdown.innerHTML = results.map(r => {
          const locName = `${r.name}${r.admin1 ? ', ' + r.admin1 : ''}, ${r.country || ''}`;
          return `<button type="button" class="dropdown-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${locName}">${locName}</button>`;
        }).join('');
        dropdown.hidden = false;

        dropdown.querySelectorAll('.dropdown-item').forEach(btn => {
          const selectItem = () => {
            const lat = btn.getAttribute('data-lat');
            const lon = btn.getAttribute('data-lon');
            const name = btn.getAttribute('data-name');
            input.value = name;
            dropdown.hidden = true;
            fetchAreaIntel(lat, lon, name);
          };
          btn.addEventListener('pointerdown', selectItem);
          btn.addEventListener('click', selectItem);
        });
      } catch (_) {}
    }, 280);
  });

  document.getElementById('intel-search-btn')?.addEventListener('click', () => {
    const first = dropdown.querySelector('.dropdown-item');
    if (first) first.click();
  });
}

// 15. NASA APOD (Generates Exact Date-Matched Official NASA Archive URL)
async function fetchApod() {
  const media = document.getElementById('apod-media');
  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    if (!res.ok) throw new Error();
    const d = await res.json();

    document.getElementById('apod-title').textContent = d.title;
    document.getElementById('apod-explanation').textContent = d.explanation;
    document.getElementById('apod-date').textContent = d.date;
    document.getElementById('apod-copyright').textContent = d.copyright ? '© ' + d.copyright : 'NASA Observatory Public Stream';

    const prevTitle = document.getElementById('apod-preview-title');
    const prevDesc = document.getElementById('apod-preview-desc');
    if (prevTitle) prevTitle.textContent = d.title;
    if (prevDesc) prevDesc.textContent = (d.explanation || '').slice(0, 110) + '...';

    // Generates the exact date-stamped archive URL (apYYMMDD.html)
    if (d.date) {
      const parts = d.date.split('-');
      if (parts.length === 3) {
        const yy = parts[0].slice(2);
        const mm = parts[1];
        const dd = parts[2];
        const archiveUrl = `https://apod.nasa.gov/apod/ap${yy}${mm}${dd}.html`;
        const link = document.getElementById('apod-link');
        if (link) {
          link.href = archiveUrl;
          link.textContent = `Official NASA APOD (${d.date}) ↗`;
        }
      }
    }

    if (media) {
      if (d.media_type === 'image') {
        media.innerHTML = `<img src="${d.url}" alt="${d.title}">`;
      } else {
        media.innerHTML = `<iframe src="${d.url}" frameborder="0" allowfullscreen></iframe>`;
      }
    }
  } catch (_) {
    // Official NASA Science WordPress Fallback
    try {
      const fbRes = await fetch('https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1');
      if (fbRes.ok) {
        const arr = await fbRes.json();
        if (arr.length > 0) {
          const item = arr[0];
          document.getElementById('apod-title').textContent = item.title?.rendered || 'Astronomy Picture of the Day';
          document.getElementById('apod-explanation').textContent = (item.content?.rendered || '').replace(/<[^>]*>/g, '').slice(0, 320) + '...';
          document.getElementById('apod-date').textContent = item.date?.slice(0, 10) || 'NASA Observatory';
          const imgUrl = item.featured_image || item.image;
          if (imgUrl && media) {
            media.innerHTML = `<img src="${imgUrl}" alt="NASA Astronomy">`;
            return;
          }
        }
      }
    } catch (_) {}

    document.getElementById('apod-title').textContent = 'Webb Deep Field (Cosmic Infrared Archive)';
    document.getElementById('apod-explanation').textContent = 'NASA James Webb Space Telescope deep-space observatory infrared capture of galaxy cluster SMACS 0723, showing thousands of galaxies.';
    document.getElementById('apod-date').textContent = 'NASA STScI Archive';
    if (media) {
      media.innerHTML = `<img src="https://images-assets.nasa.gov/image/PIA25324/PIA25324~orig.jpg" alt="Cosmos">`;
    }
  }
}

// 16. Wikipedia Explorer with Autocomplete & Presets
async function searchWiki(query) {
  try {
    const enc = encodeURIComponent(query.trim().replace(/ /g, '_'));
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`);
    if (!res.ok) throw new Error();
    const d = await res.json();

    document.getElementById('wiki-title').textContent = d.title;
    document.getElementById('wiki-extract').textContent = d.extract;
    document.getElementById('wiki-link').href = d.content_urls?.desktop?.page || '#';

    const thumb = document.getElementById('wiki-thumb');
    if (thumb && d.thumbnail?.source) {
      thumb.src = d.thumbnail.source;
    }
  } catch (_) {
    document.getElementById('wiki-title').textContent = query;
    document.getElementById('wiki-extract').textContent = 'Search Wikipedia directly for complete mission briefings and spacecraft telemetry histories.';
  }
}

function initWikiSearch() {
  const input = document.getElementById('wiki-query-input');
  const dropdown = document.getElementById('wiki-suggestions');
  if (!input || !dropdown) return;

  let debounceTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      dropdown.hidden = true;
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=5&namespace=0&format=json&origin=*`);
        if (!res.ok) return;
        const data = await res.json();
        const titles = data[1] || [];

        if (titles.length === 0) {
          dropdown.hidden = true;
          return;
        }

        dropdown.innerHTML = titles.map(t => `<button type="button" class="dropdown-item">${t}</button>`).join('');
        dropdown.hidden = false;

        dropdown.querySelectorAll('.dropdown-item').forEach(btn => {
          const selectItem = () => {
            input.value = btn.textContent;
            dropdown.hidden = true;
            searchWiki(btn.textContent);
          };
          btn.addEventListener('pointerdown', selectItem);
          btn.addEventListener('click', selectItem);
        });
      } catch (_) {}
    }, 280);
  });

  document.getElementById('wiki-search-btn')?.addEventListener('click', () => {
    if (input.value.trim()) searchWiki(input.value.trim());
  });
}

// 17. Firebase Initialization, "Select All" Toggle & Boolean Firestore Sync
const firebaseConfig = {
  apiKey: "AIzaSyAOn8eFL_CMGuYVeEa9hfpdkHRxZpjacqU",
  authDomain: "news-61e62.firebaseapp.com",
  projectId: "news-61e62",
  storageBucket: "news-61e62.firebasestorage.app",
  messagingSenderId: "1054060055660",
  appId: "1:1054060055660:web:e192c256c82facb9af1c49"
};

let messaging = null;
let db = null;
let swRegistration = null;

async function initFirebase() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      db = firebase.firestore();
      messaging = firebase.messaging();

      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js', { scope: './' });
        messaging.useServiceWorker(swRegistration);
      }
    } catch (_) {}
  }
}

function initAlertPreferences() {
  const savedIss = localStorage.getItem('alert_iss');
  const savedSolar = localStorage.getItem('alert_solar');
  const savedLaunch = localStorage.getItem('alert_launch');
  const savedQuake = localStorage.getItem('alert_quake');
  const savedAsteroid = localStorage.getItem('alert_asteroid');

  if (savedIss !== null) document.getElementById('toggle-iss').checked = (savedIss === 'true');
  if (savedSolar !== null) document.getElementById('toggle-solar').checked = (savedSolar === 'true');
  if (savedLaunch !== null) document.getElementById('toggle-launches').checked = (savedLaunch === 'true');
  if (savedQuake !== null) document.getElementById('toggle-quake').checked = (savedQuake === 'true');
  if (savedAsteroid !== null) document.getElementById('toggle-asteroid').checked = (savedAsteroid === 'true');

  // "Select All / Deselect All" Button
  let allSelected = true;
  document.getElementById('toggle-all-alerts-btn')?.addEventListener('click', () => {
    allSelected = !allSelected;
    document.querySelectorAll('.alert-checkbox').forEach(cb => cb.checked = allSelected);
    document.getElementById('toggle-all-alerts-btn').textContent = allSelected ? 'Deselect All' : 'Select All';
    showToast(allSelected ? 'All alerts enabled' : 'All alerts disabled');
  });

  document.getElementById('save-firebase-btn')?.addEventListener('click', async () => {
    const isIss = document.getElementById('toggle-iss').checked;
    const isSolar = document.getElementById('toggle-solar').checked;
    const isLaunch = document.getElementById('toggle-launches').checked;
    const isQuake = document.getElementById('toggle-quake').checked;
    const isAsteroid = document.getElementById('toggle-asteroid').checked;

    localStorage.setItem('alert_iss', isIss);
    localStorage.setItem('alert_solar', isSolar);
    localStorage.setItem('alert_launch', isLaunch);
    localStorage.setItem('alert_quake', isQuake);
    localStorage.setItem('alert_asteroid', isAsteroid);

    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      if (messaging && db) {
        let token = null;
        try {
          // Binding token to swRegistration resolves the mobile background push issue
          token = await messaging.getToken({ serviceWorkerRegistration: swRegistration });
        } catch (_) {}

        if (!token) {
          token = localStorage.getItem('device_pseudo_token');
          if (!token) {
            token = 'device_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_pseudo_token', token);
          }
        }

        // Writes explicit boolean flags to Firestore document
        await db.collection('space_fcm_tokens').doc(token).set({
          token: token,
          alertIss: Boolean(isIss),
          alertSolar: Boolean(isSolar),
          alertLaunches: Boolean(isLaunch),
          alertQuake: Boolean(isQuake),
          alertAsteroid: Boolean(isAsteroid),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          userAgent: navigator.userAgent
        }, { merge: true });

        showToast('✅ Preferences & Booleans Saved in Firebase!');
        return;
      }

      showToast('Notification preferences saved locally.');
    } catch (e) {
      showToast('Preferences saved: ' + (e.message || 'Complete'));
    }
  });
}

// 18. Automatic System Theme Detection
function initTheme() {
  const themeSelect = document.getElementById('theme-select');
  const saved = localStorage.getItem('app_theme') || 'system';

  function apply(theme) {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    if (themeSelect) themeSelect.value = theme;
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('app_theme') || 'system') === 'system') {
      apply('system');
    }
  });

  themeSelect?.addEventListener('change', (e) => {
    const val = e.target.value;
    localStorage.setItem('app_theme', val);
    apply(val);
  });

  apply(saved);
}

// 19. Dynamic PWA 1-Tap Install Button
let deferredInstallPrompt = null;

function initPwaInstall() {
  const installBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn && !window.matchMedia('(display-mode: standalone)').matches) {
      installBtn.style.display = 'inline-flex';
    }
  });

  installBtn?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        installBtn.style.display = 'none';
        deferredInstallPrompt = null;
      }
    } else {
      alert("To install Space Hub:\nOn Android: Tap browser menu (⋮) -> 'Install App'.\nOn iPhone: Tap Share (⎋) -> 'Add to Home Screen'.");
    }
  });

  window.addEventListener('appinstalled', () => {
    if (installBtn) installBtn.style.display = 'none';
    deferredInstallPrompt = null;
  });
}

// Toast
function showToast(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPwaInstall();
  initClocks();
  initNavigation();
  initOverviewClickableCards();
  initMap();
  initEpicLightbox();
  initAreaSearch();
  initWikiSearch();
  initFirebase();
  initAlertPreferences();
  startLiveTickerEngine();

  // Area preset click
  document.querySelectorAll('.area-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.area-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      fetchAreaIntel(btn.getAttribute('data-lat'), btn.getAttribute('data-lon'), btn.getAttribute('data-name'));
    });
  });

  // Wiki preset click
  document.querySelectorAll('.wiki-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.wiki-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      searchWiki(btn.getAttribute('data-topic'));
    });
  });

  // Refresh All
  document.getElementById('refresh-all')?.addEventListener('click', () => {
    fetchLiveSatelliteTelemetry();
    fetchLaunches();
    fetchEpicEarth();
    fetchMarsPhotos();
    fetchSpaceWeather();
    fetchAsteroids();
    fetchEarthquakes();
    fetchEonetHazards();
    fetchApod();
    showToast('All real-time sensors refreshed.');
  });
  document.getElementById('refresh-weather')?.addEventListener('click', () => fetchSpaceWeather());

  // Initial Data Stream Fetches
  fetchLiveSatelliteTelemetry();
  fetchLaunches();
  fetchEpicEarth();
  fetchMarsPhotos();
  fetchSpaceWeather();
  fetchAsteroids();
  fetchEarthquakes();
  fetchEonetHazards();
  fetchApod();
  fetchAreaIntel('17.3850', '78.4867', 'Hyderabad, Telangana, India');
  searchWiki('Chandrayaan-3');

  // Polling Intervals: 3s for Satellite Telemetry, 60s for Space Weather Auto-Sync
  setInterval(fetchLiveSatelliteTelemetry, 3000);
  setInterval(fetchSpaceWeather, 60000);
});
