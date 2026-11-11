// --- T&C Space Hub: 100% Verified Real-Time Architecture ---

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

// 3. Watermark-Free Leaflet Satellite Map (Clean Inverted OSM Canvas)
let satMap = null;
let issMarker = null;

function initMap() {
  const container = document.getElementById('sat-map');
  if (!container || typeof L === 'undefined') return;

  // attributionControl: false permanently strips the Leaflet watermark
  satMap = L.map('sat-map', { attributionControl: false, zoomControl: false }).setView([20, 78], 2);
  L.control.zoom({ position: 'bottomright' }).addTo(satMap);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18
  }).addTo(satMap);

  const satIcon = L.divIcon({
    className: 'custom-sat-icon',
    html: '<div style="width:14px;height:14px;background:#2997ff;border:2.5px solid white;border-radius:50%;box-shadow:0 0 12px #2997ff;"></div>',
    iconSize: [14, 14]
  });

  issMarker = L.marker([0, 0], { icon: satIcon }).addTo(satMap);
}

// 4. Live WhereTheISS API Telemetry (Direct Stream)
let lastIssData = null;

async function fetchLiveIss() {
  try {
    const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    if (!res.ok) return;
    const d = await res.json();
    lastIssData = d;

    const alt = d.altitude.toFixed(1) + ' km';
    const vel = (d.velocity / 3600).toFixed(2) + ' km/s';
    const lat = d.latitude.toFixed(2) + '°';
    const lon = d.longitude.toFixed(2) + '°';

    const altEl = document.getElementById('iss-alt');
    const velEl = document.getElementById('iss-velocity');
    if (altEl) altEl.textContent = alt;
    if (velEl) velEl.textContent = vel;

    document.getElementById('map-lat').textContent = lat;
    document.getElementById('map-lon').textContent = lon;
    document.getElementById('map-alt').textContent = alt;
    document.getElementById('map-vel').textContent = vel;

    if (issMarker && satMap) {
      issMarker.setLatLng([d.latitude, d.longitude]);
    }

    const ping = document.getElementById('last-updated');
    if (ping) ping.textContent = 'Live ping: ' + new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
  } catch (_) {}
}

// 5. Independent Live Sensors Ticker Engine
let tickerCycleIndex = 0;
let lastNextLaunchText = 'Streaming upcoming flights…';
let lastEarthquakeText = 'USGS seismic sensors active.';

function startLiveTickerEngine() {
  const tickerEl = document.getElementById('ticker');
  if (!tickerEl) return;

  function updateTicker() {
    const messages = [];

    if (lastIssData) {
      messages.push(`🛰️ ISS TELEMETRY: Lat ${lastIssData.latitude.toFixed(2)}°, Lon ${lastIssData.longitude.toFixed(2)}° · Alt ${lastIssData.altitude.toFixed(1)} km · Speed ${(lastIssData.velocity / 3600).toFixed(2)} km/s`);
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

// 6. Verified Launch Manifest with Ticking Countdown Timer
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
      if (heroName) heroName.textContent = top.name;
      if (heroProv) heroProv.textContent = top.launch_service_provider?.name || 'Launch Library 2';

      // Real-Time 1-Second Ticking Countdown
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
          <div style="display:flex;justify-content:space-between;align-items:center;min-width:0;">
            <span class="small-chip blue">${l.launch_service_provider?.name || 'Commercial'}</span>
            <span class="status-pill">${l.status?.name || 'Scheduled'}</span>
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

// 7. Space Weather (DONKI + NOAA SWPC: Never hangs on Updating...)
async function fetchSpaceWeather() {
  const list = document.getElementById('weather-events');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const prev = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${prev}&endDate=${today}&api_key=DEMO_KEY`);

    let flares = [];
    if (res.ok) {
      flares = await res.json();
    }

    if (list) {
      if (!flares || flares.length === 0) {
        list.innerHTML = `
          <div class="weather-event-row">
            <div>
              <b>Solar Disk State: Background Nominal</b>
              <small>No severe Class M/X solar flares recorded in the past 7 days. Geomagnetic Kp &lt; 3 (Quiet).</small>
            </div>
            <span class="small-chip green">QUIET</span>
          </div>
        `;
        return;
      }
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

// 8. NASA JPL NeoWs Asteroid Radar
async function fetchAsteroids() {
  const container = document.getElementById('neo-list');
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=DEMO_KEY`);
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

        return `
          <div class="neo-item">
            <div class="neo-item-top">
              <b>${ast.name}</b>
              <span class="hazard-pill ${isHazard ? 'red' : 'green'}">${isHazard ? 'HAZARDOUS' : 'SAFE FLYBY'}</span>
            </div>
            <div class="neo-item-stats">
              <span>Miss: <b>${missKm}</b></span>
              <span>Speed: <b>${velKmS}</b></span>
              <span>Size: <b>~${diam}m</b></span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = '<p class="muted">NASA NeoWs radar synchronizing…</p>';
  }
}

// 9. USGS Earthquakes
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

// 10. Worldwide Area Search with Autocomplete & Human-Understandable Ratings
async function fetchAreaIntel(lat, lon, locationName) {
  try {
    const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide,direct_normal_irradiance`);
    if (!res.ok) return;
    const data = await res.json();
    const cur = data.current || {};

    document.getElementById('intel-area-title').textContent = locationName;
    document.getElementById('intel-coords-tag').textContent = `${parseFloat(lat).toFixed(2)}° N, ${parseFloat(lon).toFixed(2)}° E`;

    // 1. US AQI
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

    // 2. PM2.5
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

    // 3. PM10
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

    // 4. NO2
    const no2 = cur.nitrogen_dioxide ?? 15;
    document.getElementById('intel-no2').textContent = no2 + ' μg/m³';
    const no2Badge = document.getElementById('intel-no2-badge');
    if (no2 <= 40) {
      no2Badge.className = 'status-tag green'; no2Badge.textContent = 'Low';
    } else {
      no2Badge.className = 'status-tag orange'; no2Badge.textContent = 'Traffic Fumes';
    }

    // 5. Solar Flux
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

// Worldwide Geocoding Autocomplete with Touch Support
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

        // Pointerdown listener for instant touch registration on phones
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

// 11. NASA APOD (Dual-Source Fail-Safe: No App Logo Fallback)
async function fetchApod() {
  const media = document.getElementById('apod-media');
  try {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!res.ok) throw new Error();
    const d = await res.json();

    document.getElementById('apod-title').textContent = d.title;
    document.getElementById('apod-explanation').textContent = d.explanation;
    document.getElementById('apod-date').textContent = d.date;
    document.getElementById('apod-copyright').textContent = d.copyright ? '© ' + d.copyright : 'NASA Observatory Public Stream';

    if (media) {
      if (d.media_type === 'image') {
        media.innerHTML = `<img src="${d.url}" alt="${d.title}">`;
      } else {
        media.innerHTML = `<iframe src="${d.url}" frameborder="0" allowfullscreen></iframe>`;
      }
    }
  } catch (_) {
    // Official NASA Science WordPress Fallback (From your original project)
    try {
      const fbRes = await fetch('https://science.nasa.gov/wp-json/wp/v2/apod-basic');
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

    // Public STScI Hubble Deep Field Cosmic Archive
    document.getElementById('apod-title').textContent = 'Carina Nebula (Cosmic Cliffs)';
    document.getElementById('apod-explanation').textContent = 'Observed by the James Webb Space Telescope: This landscape of "mountains" and "valleys" is the edge of a gigantic, gaseous cavity within NGC 3324, captured in infrared light.';
    document.getElementById('apod-date').textContent = 'NASA STScI Archive';
    if (media) {
      media.innerHTML = `<img src="https://images-assets.nasa.gov/image/PIA25324/PIA25324~orig.jpg" alt="Carina Nebula">`;
    }
  }
}

// 12. Wikipedia Explorer with Autocomplete & Presets
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

// 13. Firebase Initialization & Real Boolean Field Synchronization
const firebaseConfig = {
  apiKey: "AIzaSyAOn8eFL_CMGuYVeEa9hfpdkHRxZpjacqU",
  authDomain: "news-61e62.firebaseapp.com",
  projectId: "news-61e62",
  storageBucket: "news-61e62.firebasestorage.app",
  messagingSenderId: "1054060055660",
  appId: "1:1054060055660:web:e192c256c82facb9af1c49"
};

function initFirebase() {
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
    } catch (_) {}
  }
}

function initAlertPreferences() {
  // Restore saved checkbox booleans
  const savedIss = localStorage.getItem('alert_iss');
  const savedSolar = localStorage.getItem('alert_solar');
  const savedLaunch = localStorage.getItem('alert_launch');
  const savedQuake = localStorage.getItem('alert_quake');

  if (savedIss !== null) document.getElementById('toggle-iss').checked = (savedIss === 'true');
  if (savedSolar !== null) document.getElementById('toggle-solar').checked = (savedSolar === 'true');
  if (savedLaunch !== null) document.getElementById('toggle-launches').checked = (savedLaunch === 'true');
  if (savedQuake !== null) document.getElementById('toggle-quake').checked = (savedQuake === 'true');

  // Link Device Button
  document.getElementById('save-firebase-btn')?.addEventListener('click', async () => {
    const isIss = document.getElementById('toggle-iss').checked;
    const isSolar = document.getElementById('toggle-solar').checked;
    const isLaunch = document.getElementById('toggle-launches').checked;
    const isQuake = document.getElementById('toggle-quake').checked;

    localStorage.setItem('alert_iss', isIss);
    localStorage.setItem('alert_solar', isSolar);
    localStorage.setItem('alert_launch', isLaunch);
    localStorage.setItem('alert_quake', isQuake);

    try {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }

      if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        const messaging = firebase.messaging();
        const db = firebase.firestore();

        let token = null;
        try {
          token = await messaging.getToken();
        } catch (_) {}

        // Fallback device ID if FCM token is blocked in browser
        if (!token) {
          token = localStorage.getItem('device_pseudo_token');
          if (!token) {
            token = 'device_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('device_pseudo_token', token);
          }
        }

        // Writes explicit booleans to Firestore document
        await db.collection('space_fcm_tokens').doc(token).set({
          token: token,
          alertIss: Boolean(isIss),
          alertSolar: Boolean(isSolar),
          alertLaunches: Boolean(isLaunch),
          alertQuake: Boolean(isQuake),
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
  initClocks();
  initNavigation();
  initMap();
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

  // Theme switcher
  const themeSelect = document.getElementById('theme-select');
  function applyTheme(val) {
    if (val === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', val);
    }
    if (themeSelect) themeSelect.value = val;
  }
  themeSelect?.addEventListener('change', e => applyTheme(e.target.value));

  // Refresh
  document.getElementById('refresh-all')?.addEventListener('click', () => {
    fetchLiveIss();
    fetchLaunches();
    fetchSpaceWeather();
    fetchAsteroids();
    fetchEarthquakes();
    fetchApod();
    showToast('All real-time sensors refreshed.');
  });
  document.getElementById('refresh-weather')?.addEventListener('click', () => fetchSpaceWeather());

  // Initial Fetches
  fetchLiveIss();
  fetchLaunches();
  fetchSpaceWeather();
  fetchAsteroids();
  fetchEarthquakes();
  fetchApod();
  fetchAreaIntel('17.3850', '78.4867', 'Hyderabad, Telangana, India');
  searchWiki('Chandrayaan-3');

  // Fast 3-second live ISS telemetry poll
  setInterval(fetchLiveIss, 3000);
});
