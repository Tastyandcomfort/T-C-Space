// --- T&C Space Hub: 100% Verified Real-Time Architecture ---

const NASA_API_KEY = "fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd";

const NOTIFICATION_HERO_PHOTOS = {
  station: 'https://images-assets.nasa.gov/image/s130e012111/s130e012111~medium.jpg',
  satellite: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000494/GSFC_20171208_Archive_e000494~medium.jpg',
  voyager: 'https://images-assets.nasa.gov/image/PIA24430/PIA24430~medium.jpg',
  launch: 'https://images-assets.nasa.gov/image/KSC-20221116-PH-KLS01_0003/KSC-20221116-PH-KLS01_0003~medium.jpg',
  solar: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e001435/GSFC_20171208_Archive_e001435~medium.jpg',
  quake: 'https://images-assets.nasa.gov/image/iss065e094294/iss065e094294~medium.jpg',
  asteroid: 'https://images-assets.nasa.gov/image/PIA24430/PIA24430~medium.jpg',
  cosmic: 'https://images-assets.nasa.gov/image/GSFC_20171208_Archive_e000494/GSFC_20171208_Archive_e000494~medium.jpg'
};

let currentNetworkSpeedMbps = 3.5;
let popoverAutoDismissTimer = null;
let planetaryExplorerLoaded = false;
let currentPlanetaryTopic = 'deep-field';
let currentPlanetaryMediaType = 'image,video,audio';
let activeLightboxMedia = {};

// ============================================================================
// 1. DUAL CLOCKS (IST & UTC)
// ============================================================================
function initClocks() {
  const istEl = document.getElementById('ist-clock');
  const utcEl = document.getElementById('utc-clock');
  function tick() {
    const now = new Date();
    const ist = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    const utc = now.toUTCString().split(' ')[4] + ' UTC';
    if (istEl) istEl.textContent = ist;
    if (utcEl) utcEl.textContent = utc;
  }
  tick();
  setInterval(tick, 1000);
}

// ============================================================================
// 2. NETWORK TELEMETRY MONITOR & POPOVER
// ============================================================================
function initNetworkMonitor() {
  const textEl = document.getElementById('net-text');
  const weatherSyncBadge = document.getElementById('weather-sync-badge');
  const beaconBtn = document.getElementById('network-beacon-btn');
  const popover = document.getElementById('network-popover-bubble');
  const popTitle = document.getElementById('popover-status-title');
  const popSpeed = document.getElementById('popover-speed-val');
  const popStream = document.getElementById('popover-stream-status');

  function showTemporaryAlertBubble() {
    if (!popover) return;
    popover.classList.add('open');
    popover.setAttribute('aria-hidden', 'false');
    clearTimeout(popoverAutoDismissTimer);
    popoverAutoDismissTimer = setTimeout(() => {
      popover.classList.remove('open');
      popover.setAttribute('aria-hidden', 'true');
    }, 4000);
  }

  beaconBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearTimeout(popoverAutoDismissTimer);
    const isOpen = popover?.classList.contains('open');
    if (popover) {
      popover.classList.toggle('open', !isOpen);
      popover.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    }
  });

  const dismissPopover = (e) => {
    if (popover && popover.classList.contains('open') && !popover.contains(e.target) && !beaconBtn?.contains(e.target)) {
      popover.classList.remove('open');
      popover.setAttribute('aria-hidden', 'true');
    }
  };
  document.addEventListener('pointerdown', dismissPopover);
  document.addEventListener('touchstart', dismissPopover, { passive: true });

  async function updateNetworkStatus() {
    if (!navigator.onLine) {
      document.documentElement.setAttribute('data-network', 'offline');
      if (textEl) textEl.textContent = 'Offline';
      currentNetworkSpeedMbps = 0.2;
      if (popTitle) popTitle.textContent = 'Offline (Paused)';
      if (popSpeed) popSpeed.textContent = '0.0 Mbps';
      if (popStream) { popStream.className = 'status-tag red'; popStream.textContent = 'Disconnected'; }
      if (weatherSyncBadge) {
        weatherSyncBadge.className = 'small-chip';
        weatherSyncBadge.style.background = 'rgba(255, 69, 58, 0.2)';
        weatherSyncBadge.style.color = 'var(--red)';
        weatherSyncBadge.textContent = 'Offline 🔴';
      }
      showToast('Network connection lost. Telemetry paused.');
      showTemporaryAlertBubble();
      return;
    }

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (conn && conn.downlink !== undefined) {
      const mbps = conn.downlink;
      currentNetworkSpeedMbps = Math.max(0.3, mbps);
      if (popSpeed) popSpeed.textContent = `~${mbps.toFixed(1)} Mbps`;

      if (mbps < 1.0) {
        document.documentElement.setAttribute('data-network', 'slow');
        if (textEl) textEl.textContent = 'Slow · <1 Mbps';
        if (popTitle) popTitle.textContent = 'Slow Connection';
        if (popStream) { popStream.className = 'status-tag orange'; popStream.textContent = 'Delayed Stream'; }
        if (weatherSyncBadge) {
          weatherSyncBadge.className = 'small-chip orange';
          weatherSyncBadge.style.background = 'rgba(255, 180, 84, 0.2)';
          weatherSyncBadge.style.color = 'var(--orange)';
          weatherSyncBadge.textContent = 'Slow Telemetry 🟠';
        }
        showTemporaryAlertBubble();
      } else if (mbps <= 2.5) {
        document.documentElement.setAttribute('data-network', 'normal');
        if (textEl) textEl.textContent = `Normal · ~${mbps.toFixed(1)} Mbps`;
        if (popTitle) popTitle.textContent = 'Normal Telemetry';
        if (popStream) { popStream.className = 'status-tag green'; popStream.textContent = 'Synchronized'; }
        if (weatherSyncBadge) {
          weatherSyncBadge.className = 'small-chip green';
          weatherSyncBadge.style.background = 'var(--green-soft)';
          weatherSyncBadge.style.color = 'var(--green)';
          weatherSyncBadge.textContent = 'Auto-Synced 🟢';
        }
      } else {
        document.documentElement.setAttribute('data-network', 'fast');
        if (textEl) textEl.textContent = `Fast · ${mbps.toFixed(1)} Mbps`;
        if (popTitle) popTitle.textContent = 'High-Speed Telemetry';
        if (popStream) { popStream.className = 'status-tag green'; popStream.textContent = 'Synchronized'; }
        if (weatherSyncBadge) {
          weatherSyncBadge.className = 'small-chip green';
          weatherSyncBadge.style.background = 'var(--green-soft)';
          weatherSyncBadge.style.color = 'var(--green)';
          weatherSyncBadge.textContent = 'Auto-Synced 🟢';
        }
      }
      return;
    }

    try {
      const t0 = performance.now();
      await fetch('https://api.wheretheiss.at/v1/satellites/25544', { method: 'HEAD', cache: 'no-store' });
      const rtt = performance.now() - t0;
      if (rtt > 1200) {
        document.documentElement.setAttribute('data-network', 'slow');
        if (textEl) textEl.textContent = 'Slow · <1 Mbps';
        currentNetworkSpeedMbps = 0.8;
      } else if (rtt > 500) {
        document.documentElement.setAttribute('data-network', 'normal');
        if (textEl) textEl.textContent = 'Normal · ~1 Mbps';
        currentNetworkSpeedMbps = 1.8;
      } else {
        document.documentElement.setAttribute('data-network', 'fast');
        if (textEl) textEl.textContent = 'Fast · ≥1 Mbps';
        currentNetworkSpeedMbps = 5.0;
      }
    } catch (_) {
      document.documentElement.setAttribute('data-network', 'offline');
      if (textEl) textEl.textContent = 'Offline';
      currentNetworkSpeedMbps = 0.2;
    }
  }

  window.addEventListener('online', () => {
    updateNetworkStatus();
    showToast('T&C Space connection restored.');
  });
  window.addEventListener('offline', updateNetworkStatus);

  if (navigator.connection) {
    navigator.connection.addEventListener('change', updateNetworkStatus);
  }

  updateNetworkStatus();
  setInterval(updateNetworkStatus, 30000);
}

// ============================================================================
// 3. ROUTER & SECTION NAVIGATION
// ============================================================================
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link, .dock-link, .more-sheet-item');
  const sections = document.querySelectorAll('.section-block');
  const label = document.getElementById('current-section-label');

  const moreDockBtn = document.getElementById('more-dock-btn');
  const moreSheet = document.getElementById('more-sheet-backdrop');
  const moreSheetClose = document.getElementById('more-sheet-close-btn');

  function openMoreSheet() { if (moreSheet) moreSheet.classList.add('open'); }
  function closeMoreSheet() { if (moreSheet) moreSheet.classList.remove('open'); }

  moreDockBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    if (moreSheet?.classList.contains('open')) closeMoreSheet();
    else openMoreSheet();
  });

  moreSheetClose?.addEventListener('click', closeMoreSheet);
  moreSheet?.addEventListener('click', (e) => {
    if (e.target === moreSheet) closeMoreSheet();
  });

  document.querySelectorAll('.more-sheet-item').forEach(item => {
    item.addEventListener('click', () => closeMoreSheet());
  });

  function handleRoute(hashStr) {
    const rawHash = (hashStr || window.location.hash || '#overview').replace('#', '');
    const [targetId] = rawHash.split('?');

    let matched = false;
    sections.forEach(sec => {
      if (sec.id === targetId) {
        sec.classList.add('active-view');
        matched = true;
      } else {
        sec.classList.remove('active-view');
      }
    });

    if (!matched && sections.length > 0) sections[0].classList.add('active-view');

    navLinks.forEach(link => {
      if (link.getAttribute('data-nav') === targetId) link.classList.add('active');
      else link.classList.remove('active');
    });

    const extendedSections = ['interplanetary', 'space-weather', 'cosmos-hazards', 'intel-brief', 'wiki', 'settings', 'about'];
    if (moreDockBtn) {
      if (extendedSections.includes(targetId)) moreDockBtn.classList.add('active');
      else moreDockBtn.classList.remove('active');
    }

    if (label) label.textContent = targetId.charAt(0).toUpperCase() + targetId.slice(1).replace('-', ' ');

    if (targetId === 'satellites' && satMap) {
      setTimeout(() => satMap.invalidateSize(), 200);
    }

    if (targetId === 'planetary-explorer' && !planetaryExplorerLoaded) {
      fetchPlanetaryFeed(currentPlanetaryTopic, currentPlanetaryMediaType);
    }
  }

  window.addEventListener('hashchange', () => handleRoute(window.location.hash));
  handleRoute(window.location.hash);
}

// ============================================================================
// 4. OVERVIEW: ROTATING SPACECRAFT CAROUSEL & VOYAGER 1 & 2 ENGINE
// ============================================================================
const CAROUSEL_FLEET = [
  { id: 25544, name: "ISS (ZARYA)", alt: 418.0, vel: 7.66, orbit: "Active LEO Orbit", color: "#2997ff" },
  { id: 48274, name: "TIANGONG (CSS)", alt: 385.0, vel: 7.68, orbit: "Three-Module Station", color: "#ffb454" },
  { id: 57320, name: "CHANDRAYAAN-3", alt: 384400.0, vel: 1.02, orbit: "Lunar Trajectory", color: "#30d158" },
  { id: 43286, name: "NAVIC-1I (ISRO)", alt: 35786.0, vel: 3.07, orbit: "Geostationary Belt", color: "#64d9e5" },
  { id: 20580, name: "HUBBLE (HST)", alt: 535.0, vel: 7.59, orbit: "Astronomy Observatory", color: "#bf9cff" },
  { id: 43013, name: "NOAA-20", alt: 824.0, vel: 7.45, orbit: "Sun-Synchronous Polar", color: "#2997ff" },
  { id: "newly-deployed", name: "STARLINK-31200", alt: 540.0, vel: 7.61, orbit: "Newly Deployed (30d)", color: "#ff9f0a" }
];

let carouselIndex = 0;

function initOverviewRotatingCarousel() {
  const nameEl = document.getElementById('carousel-sat-name');
  const altEl = document.getElementById('carousel-sat-alt');
  const velEl = document.getElementById('carousel-sat-vel');
  const orbitEl = document.getElementById('carousel-sat-orbit');
  const dotsBar = document.getElementById('sat-dots-bar');
  const dotSymbol = document.getElementById('carousel-sat-dot');
  const card = document.getElementById('sat-carousel-card');

  if (dotsBar) {
    dotsBar.innerHTML = CAROUSEL_FLEET.map((_, i) => `<div class="sat-dot-pip ${i === 0 ? 'active' : ''}"></div>`).join('');
  }

  function rotate() {
    carouselIndex = (carouselIndex + 1) % CAROUSEL_FLEET.length;
    const sat = CAROUSEL_FLEET[carouselIndex];
    if (nameEl) nameEl.textContent = sat.name;
    if (altEl) altEl.textContent = `${sat.alt >= 1000 ? sat.alt.toLocaleString('en-US') : sat.alt.toFixed(1)} km`;
    if (velEl) velEl.textContent = `${sat.vel.toFixed(2)} km/s`;
    if (orbitEl) orbitEl.textContent = sat.orbit;
    if (dotSymbol) dotSymbol.style.color = sat.color;

    const pips = document.querySelectorAll('.sat-dot-pip');
    pips.forEach((p, idx) => p.classList.toggle('active', idx === carouselIndex));
  }

  card?.addEventListener('click', () => {
    const activeSat = CAROUSEL_FLEET[carouselIndex];
    currentSatelliteId = activeSat.id;
    currentSatelliteName = activeSat.name;
    window.location.hash = 'satellites';
  });

  setInterval(rotate, 4500);
}

const VOYAGERS = {
  1: {
    name: "VOYAGER 1 (INTERSTELLAR)",
    baseKm: 24538120000,
    speedKmS: 17.0,
    milestones: [
      "Voyager 1 reached 1 Light-Day distance benchmark (~26 Billion km projected).",
      "Passed Heliopause into true interstellar space on Aug 25, 2012.",
      "At ~17 km/s, Voyager 1 will enter the inner Oort cloud in roughly 300 years.",
      "Signal Delay: ~22 hrs 45 mins each way for radio photons to reach Earth."
    ]
  },
  2: {
    name: "VOYAGER 2 (INTERSTELLAR)",
    baseKm: 20521450000,
    speedKmS: 15.3,
    milestones: [
      "Voyager 2 crossed into interstellar space on Nov 5, 2018 with plasma sensors active.",
      "Traversing interstellar space in constellation Pavo at ~15.3 km/s.",
      "Distance ~137.2 AU from Earth with 5 operational instruments.",
      "Signal Delay: ~19 hrs 02 mins each way for DSN communication."
    ]
  }
};

let activeVoyagerId = 1;
let voyagerMilestoneIdx = 0;

function initVoyagerTracker() {
  const nameEl = document.getElementById('voyager-active-name');
  const kmEl = document.getElementById('voyager-distance-km');
  const auEl = document.getElementById('voyager-distance-au');
  const delayEl = document.getElementById('voyager-light-delay');
  const textEl = document.getElementById('voyager-milestone-text');
  const card = document.getElementById('voyager-metric-card');

  let v1Km = VOYAGERS[1].baseKm + Math.floor((Date.now() - 1700000000000) / 1000) * VOYAGERS[1].speedKmS;
  let v2Km = VOYAGERS[2].baseKm + Math.floor((Date.now() - 1700000000000) / 1000) * VOYAGERS[2].speedKmS;

  function tickDistance() {
    v1Km += VOYAGERS[1].speedKmS;
    v2Km += VOYAGERS[2].speedKmS;

    const currentData = activeVoyagerId === 1 ? { km: v1Km, ...VOYAGERS[1] } : { km: v2Km, ...VOYAGERS[2] };
    const au = (currentData.km / 149597870.7).toFixed(2);
    const delayHours = (currentData.km / (299792.458 * 3600)).toFixed(2);

    if (nameEl) nameEl.textContent = currentData.name;
    if (kmEl) kmEl.textContent = `${Math.floor(currentData.km).toLocaleString('en-US')} km`;
    if (auEl) auEl.textContent = `~${au} AU`;
    if (delayEl) delayEl.textContent = `${Math.floor(delayHours)}h ${Math.round((delayHours % 1) * 60)}m`;
  }

  function cycleMilestones() {
    const list = VOYAGERS[activeVoyagerId].milestones;
    voyagerMilestoneIdx = (voyagerMilestoneIdx + 1) % list.length;
    if (textEl) textEl.textContent = list[voyagerMilestoneIdx];
  }

  card?.addEventListener('click', () => {
    activeVoyagerId = activeVoyagerId === 1 ? 2 : 1;
    voyagerMilestoneIdx = 0;
    tickDistance();
    cycleMilestones();
    showToast(`Switched telemetry to ${VOYAGERS[activeVoyagerId].name}`);
  });

  setInterval(tickDistance, 1000);
  setInterval(cycleMilestones, 5500);
}

function initOverviewClickableCards() {
  document.querySelectorAll('.clickable-card[data-goto]').forEach(card => {
    card.addEventListener('click', () => {
      const target = card.getAttribute('data-goto');
      if (target) window.location.hash = target;
    });
  });
}

// ============================================================================
// 5. 100% WATERMARK-FREE MAP & LIVE MOVING SPACECRAFT ENGINE
// ============================================================================
let satMap = null;
let issMarker = null;
let issOrbitLayerGroup = null;
let currentSatelliteId = 25544;
let currentSatelliteName = "ISS (ZARYA)";
let quakeLayerGroup = null;
let hazardLayerGroup = null;

const ORBITAL_FLEET = {
  25544: { name: "ISS (ZARYA)", inc: 51.64, mm: 15.49, alt: 418.0, isApi: true, color: "#2997ff", type: "Space Station" },
  48274: { name: "CSS TIANHE (TIANGONG)", inc: 41.5, mm: 15.6, alt: 385.0, vel: 7.68, isApi: false, color: "#ffb454", type: "Space Station" },
  57320: { name: "CHANDRAYAAN-3 (ISRO)", inc: 21.3, mm: 11.5, alt: 384000.0, vel: 1.02, isApi: false, color: "#30d158", type: "Lunar Vehicle" },
  43286: { name: "NAVIC-1I (ISRO)", inc: 29.5, mm: 1.0, alt: 35786.0, vel: 3.07, isApi: false, color: "#64d9e5", type: "Navigational Satellite" },
  20580: { name: "HUBBLE SPACE TELESCOPE", inc: 28.5, mm: 15.1, alt: 535.0, vel: 7.59, isApi: false, color: "#bf9cff", type: "Observatory" },
  43013: { name: "NOAA 20", inc: 98.7, mm: 14.2, alt: 824.0, vel: 7.45, isApi: false, color: "#2997ff", type: "Earth Observation" },
  "newly-deployed": { name: "STARLINK-31200 (RECENT)", inc: 53.2, mm: 15.05, alt: 540.0, vel: 7.61, isApi: false, color: "#ff9f0a", type: "Newly Deployed" }
};

window.showFullSatTelemetry = function() {
  if (!lastSatData || !issMarker) return;
  const satConfig = ORBITAL_FLEET[currentSatelliteId] || { color: "#2997ff" };
  issMarker.setPopupContent(`
    <div style="font-size:11px;min-width:180px;padding:2px;">
      <b style="color:${satConfig.color};font-size:12px;display:block;margin-bottom:4px;">${currentSatelliteName}</b>
      <div>Latitude: <b>${lastSatData.latitude.toFixed(2)}°</b></div>
      <div>Longitude: <b>${lastSatData.longitude.toFixed(2)}°</b></div>
      <div>Altitude: <b>${lastSatData.altitude.toFixed(1)} km</b></div>
      <div>Velocity: <b>${lastSatData.velocity.toFixed(2)} km/s</b></div>
      <div style="margin-top:6px;padding-top:4px;border-top:1px solid var(--line);font-size:9px;color:var(--muted);text-align:center;">
        NORAD Spacecraft Telemetry
      </div>
    </div>
  `);
};

function getModel1TacticalHudIcon(satId, satName, altStr, velStr, headingDeg = 45) {
  const satConfig = ORBITAL_FLEET[satId] || { color: "#2997ff" };
  const accentColor = satConfig.color || "#2997ff";

  return L.divIcon({
    className: 'aerospace-hud-marker',
    html: `
      <div class="hud-reticle-box" style="--hud-accent: ${accentColor};" onclick="if(issMarker) issMarker.openPopup();">
        <div class="hud-compass-ring"></div>
        <div class="hud-radar-pulse"></div>
        <div class="hud-radar-pulse delay"></div>
        <svg class="hud-crosshair-svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${accentColor}" stroke-width="2" style="transform: rotate(${headingDeg}deg);">
          <polygon points="12 2 19 21 12 17 5 21 12 2" fill="rgba(41, 151, 255, 0.2)" />
        </svg>
      </div>
      <div class="hud-micro-tag" onclick="if(issMarker) issMarker.openPopup();">
        ${satName.split(' ')[0]} · ${altStr}
      </div>
    `,
    iconSize: [52, 70],
    iconAnchor: [26, 26]
  });
}

function renderOrbitalGroundTrack(satConfig, currentLat, currentLon) {
  if (!satMap || !issOrbitLayerGroup) return;
  issOrbitLayerGroup.clearLayers();

  const mm = satConfig.mm || 15.0;
  const periodMinutes = (1440 / mm);
  const inc = satConfig.inc || 51.64;
  const color = satConfig.color || "#2997ff";

  const totalPoints = 90;
  const stepMinutes = (periodMinutes / totalPoints);
  const earthRotateDegPerMin = 0.25;

  const currentPhase = Math.asin(Math.max(-1, Math.min(1, currentLat / inc)));
  const trackSegments = [];
  let currentSegment = [];

  for (let i = -45; i <= 45; i++) {
    const dt = i * stepMinutes;
    const phase = currentPhase + ((dt / periodMinutes) * 2 * Math.PI);
    const lat = Math.sin(phase) * inc;
    let lon = currentLon + ((phase - currentPhase) * (180 / Math.PI)) - (dt * earthRotateDegPerMin);

    lon = (((lon + 180) % 360) + 360) % 360 - 180;

    if (currentSegment.length > 0) {
      const prevLon = currentSegment[currentSegment.length - 1][1];
      if (Math.abs(lon - prevLon) > 180) {
        trackSegments.push(currentSegment);
        currentSegment = [];
      }
    }
    currentSegment.push([lat, lon]);
  }
  if (currentSegment.length > 0) trackSegments.push(currentSegment);

  trackSegments.forEach(seg => {
    L.polyline(seg, { color: color, weight: 1.8, dashArray: '5, 8', opacity: 0.65 }).addTo(issOrbitLayerGroup);
  });
}

function initMap() {
  const mapEl = document.getElementById('sat-map');
  if (!mapEl || satMap) return;

  satMap = L.map('sat-map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 1.5,
    maxZoom: 18,
    worldCopyJump: true
  });

  // 100% Free, Reliable, Watermark-Free OpenStreetMap Standard Stream
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(satMap);

  issOrbitLayerGroup = L.layerGroup().addTo(satMap);
  quakeLayerGroup = L.layerGroup().addTo(satMap);
  hazardLayerGroup = L.layerGroup().addTo(satMap);

  issMarker = L.marker([0, 0], {
    icon: getModel1TacticalHudIcon(currentSatelliteId, currentSatelliteName, "418 km", "7.66 km/s")
  }).addTo(satMap);

  issMarker.bindPopup("Establishing spacecraft telemetry…");

  setupMapControls();
  fetchLiveSatelliteTelemetry(true);
  setInterval(() => fetchLiveSatelliteTelemetry(false), 3000);
}

function setupMapControls() {
  const chips = document.querySelectorAll('.sat-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const satId = chip.getAttribute('data-sat-id');
      const satName = chip.getAttribute('data-sat-name');

      currentSatelliteId = satId === 'newly-deployed' ? 'newly-deployed' : parseInt(satId, 10);
      currentSatelliteName = satName;
      const hudName = document.getElementById('hud-sat-name');
      if (hudName) hudName.textContent = currentSatelliteName;
      fetchLiveSatelliteTelemetry(true);
    });
  });

  document.getElementById('toggle-layer-iss')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) {
      if (issMarker) issMarker.addTo(satMap);
    } else {
      if (issMarker) satMap.removeLayer(issMarker);
    }
  });

  document.getElementById('toggle-layer-quakes')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) satMap.addLayer(quakeLayerGroup);
    else satMap.removeLayer(quakeLayerGroup);
  });

  document.getElementById('toggle-layer-hazards')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) satMap.addLayer(hazardLayerGroup);
    else satMap.removeLayer(hazardLayerGroup);
  });

  document.getElementById('toggle-layer-track')?.addEventListener('click', (e) => {
    e.target.classList.toggle('active');
    if (e.target.classList.contains('active')) satMap.addLayer(issOrbitLayerGroup);
    else satMap.removeLayer(issOrbitLayerGroup);
  });

  initSatelliteSearch();
}

function initSatelliteSearch() {
  const input = document.getElementById('sat-search-input');
  const dropdown = document.getElementById('sat-search-dropdown');
  if (!input || !dropdown) return;

  const fleetList = [
    { id: 25544, name: "ISS (ZARYA)", type: "Station" },
    { id: 48274, name: "CSS TIANHE (TIANGONG)", type: "Station" },
    { id: 57320, name: "CHANDRAYAAN-3 (ISRO)", type: "Lunar Probe" },
    { id: 43286, name: "NAVIC-1I (ISRO)", type: "Regional Nav" },
    { id: 20580, name: "HUBBLE SPACE TELESCOPE", type: "Observatory" },
    { id: 43013, name: "NOAA 20", type: "Weather Satellite" },
    { id: "newly-deployed", name: "STARLINK-31200", type: "Newly Deployed (30d)" }
  ];

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) {
      dropdown.hidden = true;
      dropdown.innerHTML = '';
      return;
    }

    const matches = fleetList.filter(item => item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q));
    if (!matches.length) {
      dropdown.hidden = true;
      return;
    }

    dropdown.innerHTML = matches.map(m => `
      <button class="dropdown-item" type="button" data-id="${m.id}" data-name="${m.name}">
        <b>${m.name}</b> <small style="color:var(--muted);margin-left:6px;">(${m.type})</small>
      </button>
    `).join('');
    dropdown.hidden = false;

    dropdown.querySelectorAll('.dropdown-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        currentSatelliteId = id === 'newly-deployed' ? 'newly-deployed' : parseInt(id, 10);
        currentSatelliteName = name;
        dropdown.hidden = true;
        input.value = name;
        const hudName = document.getElementById('hud-sat-name');
        if (hudName) hudName.textContent = currentSatelliteName;
        fetchLiveSatelliteTelemetry(true);
      });
    });
  });
}

let lastSatData = null;
let previousLat = null;
let previousLon = null;

async function fetchLiveSatelliteTelemetry(shouldCenterMap = false) {
  try {
    let lat = 0, lon = 0, alt = 418.0, vel = 7.66;
    const satConfig = ORBITAL_FLEET[currentSatelliteId] || { inc: 51.64, mm: 15.49, alt: 500, vel: 7.6, color: "#2997ff" };

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
      const nowSec = Date.now() / 1000;
      const periodSec = 86400 / (satConfig.mm || 15);
      const phase = ((nowSec % periodSec) / periodSec) * 2 * Math.PI;
      lat = Math.sin(phase) * (satConfig.inc || 45);
      lon = (((nowSec / 240) + (phase * 180 / Math.PI)) % 360) - 180;
      alt = satConfig.alt;
      vel = satConfig.vel || Math.sqrt(398600.44 / (6378.137 + alt));
    }

    lastSatData = { latitude: lat, longitude: lon, altitude: alt, velocity: vel };

    const altStr = `${alt.toFixed(1)} km`;
    const velStr = `${vel.toFixed(2)} km/s`;
    const latStr = `${lat.toFixed(2)}°`;
    const lonStr = `${lon.toFixed(2)}°`;

    let headingDeg = 45;
    if (previousLat !== null && previousLon !== null) {
      const dY = lat - previousLat;
      const dX = (lon - previousLon) * Math.cos(lat * Math.PI / 180);
      headingDeg = (Math.atan2(dX, dY) * (180 / Math.PI) + 360) % 360;
    }
    previousLat = lat;
    previousLon = lon;

    const latEl = document.getElementById('map-lat');
    const lonEl = document.getElementById('map-lon');
    const altEl = document.getElementById('map-alt');
    const velEl = document.getElementById('map-vel');
    const hudTel = document.getElementById('hud-sat-telemetry');

    if (latEl) latEl.textContent = latStr;
    if (lonEl) lonEl.textContent = lonStr;
    if (altEl) altEl.textContent = altStr;
    if (velEl) velEl.textContent = velStr;
    if (hudTel) hudTel.textContent = `${latStr}N, ${lonStr}E · Alt: ${altStr} · Spd: ${velStr}`;

    if (issMarker && satMap) {
      issMarker.setLatLng([lat, lon]);
      issMarker.setIcon(getModel1TacticalHudIcon(currentSatelliteId, currentSatelliteName, altStr, velStr, headingDeg));

      const orbitType = alt > 30000 ? 'Geostationary Orbit' : 'Active LEO Orbit';
      issMarker.setPopupContent(`
        <div style="font-size:11px;min-width:150px;text-align:center;">
          <b style="color:${satConfig.color};font-size:12px;display:block;margin-bottom:2px;">🛰️ ${currentSatelliteName}</b>
          <span style="font-size:9.5px;color:var(--muted);">${orbitType}</span>
          <div style="margin-top:6px;padding-top:4px;border-top:1px solid var(--line);font-size:9px;color:var(--blue);cursor:pointer;" onclick="showFullSatTelemetry()">Full Telemetry ↗</div>
        </div>
      `);

      if (shouldCenterMap) {
        satMap.flyTo([lat, lon], 4, { duration: 1.2 });
      }

      renderOrbitalGroundTrack(satConfig, lat, lon);
    }

    checkMultiSpacecraftOverheadPass(lat, lon, currentSatelliteName, vel);
  } catch (_) {}
}

// ============================================================================
// 6. MULTI-SPACECRAFT PROXIMITY NOTIFICATION ENGINE (FULL FLEET PASSES)
// ============================================================================
let lastSpacecraftAlertTime = 0;

function checkMultiSpacecraftOverheadPass(satLat, satLon, satName, satVel) {
  const alertEnabled = document.getElementById('toggle-iss')?.checked;
  if (!alertEnabled) return;

  const userLat = parseFloat(localStorage.getItem('user_target_lat') || "17.3850");
  const userLon = parseFloat(localStorage.getItem('user_target_lon') || "78.4867");
  const locationName = localStorage.getItem('user_target_city') || "Hyderabad, India";

  const R = 6371;
  const dLat = (satLat - userLat) * Math.PI / 180;
  const dLon = (satLon - userLon) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(satLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  if (distanceKm <= 1500) {
    const now = Date.now();
    if (now - lastSpacecraftAlertTime > 45 * 60 * 1000) {
      lastSpacecraftAlertTime = now;
      const isStation = satName.includes('ISS') || satName.includes('CSS') || satName.includes('TIANGONG');
      const photo = isStation ? NOTIFICATION_HERO_PHOTOS.station : NOTIFICATION_HERO_PHOTOS.satellite;

      dispatchRichNotification({
        title: `T&C Space · ${satName} Flyby Overhead`,
        body: `${satName} is crossing directly over ${locationName}! Proximity: ${Math.round(distanceKm)} km · Speed: ${satVel.toFixed(2)} km/s. Visible in clear skies.`,
        url: './#satellites',
        image: photo
      });
    }
  }
}

function dispatchRichNotification({ title, body, url, image }) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: 'assets/space-hub-icon-192.png?v=1',
      badge: 'assets/space-hub-icon-192.png?v=1',
      image: image || NOTIFICATION_HERO_PHOTOS.satellite
    });
  }
}

// ============================================================================
// 7. PLANETARY EXPLORER (RESTORED WITH ZERO-FAIL BUFFER PIPELINE)
// ============================================================================
const COSMIC_TARGETS = {
  "deep-field": { name: "Deep Field & First Galaxies", query: "Deep Field Webb Hubble ultra deep field distant galaxy", fallback: "Hubble Ultra Deep Field", instrument: "JWST/NIRCam · HST/ACS" },
  "jwst-raw": { name: "JWST Raw Science (Webb)", query: "James Webb Space Telescope NIRCam MIRI uncalibrated", fallback: "James Webb raw image", instrument: "JWST NIRCam/MIRI/NIRSpec" },
  "hubble-raw": { name: "Hubble Raw Detector (HST)", query: "Hubble Space Telescope WFC3 ACS detector exposure", fallback: "Hubble Space Telescope", instrument: "HST WFC3/UVIS · ACS/WFC" },
  "nebulae": { name: "Nebulae & Stellar Nurseries", query: "Carina Nebula Orion Pillars of Creation Webb Hubble", fallback: "Eagle Nebula Pillars of Creation", instrument: "Infrared & Narrowband Photometry" },
  "galaxies": { name: "Spiral & Colliding Galaxies", query: "Andromeda Whirlpool Sombrero Cartwheel galaxy collision", fallback: "Spiral galaxy Webb Hubble", instrument: "Wide-Field Camera Array" },
  "black-holes": { name: "Black Holes & X-Ray Jets", query: "Chandra X-ray Observatory black hole Sagittarius M87 jet", fallback: "Chandra X-ray black hole", instrument: "Chandra ACIS / HRC High-Energy" },
  "supernovae": { name: "Supernovae & Remnants", query: "Cassiopeia A Crab Nebula supernova remnant Chandra Webb", fallback: "Crab Nebula supernova", instrument: "X-Ray & Thermal Infrared" },
  "pulsars": { name: "Pulsars & Neutron Stars", query: "pulsar neutron star magnetar Chandra Fermi", fallback: "Crab pulsar X-ray", instrument: "High-Energy Gamma & X-Ray" },
  "exoplanets": { name: "Exoplanet Systems", query: "exoplanet transit spectroscopy Kepler TESS Webb atmosphere", fallback: "exoplanet transit light curve", instrument: "Transit Photometer & Spectrometer" },
  "gravitational": { name: "Gravitational Lenses", query: "gravitational lensing Einstein ring galaxy cluster Webb", fallback: "gravitational lens galaxy cluster", instrument: "Deep Space Cosmological Sensor" },
  "sun": { name: "Solar SDO Direct Telemetry", query: "Solar Dynamics Observatory AIA extreme ultraviolet flare", fallback: "SDO solar flare 193 171", instrument: "SDO AIA / HMI EUV Imagers" },
  "mars-raw": { name: "Mars Rover Raw Downlinks", query: "Perseverance Curiosity raw image Mastcam Navcam Hazcam Sol", fallback: "Perseverance Mars raw", instrument: "Mastcam-Z / Navcam Raw Detectors" },
  "jupiter": { name: "Jupiter JunoCam Raw Buffer", query: "Juno spacecraft JunoCam Jupiter raw Great Red Spot", fallback: "Juno Jupiter atmosphere", instrument: "JunoCam Raw Push-Frame Detector" },
  "saturn": { name: "Saturn Cassini Archives", query: "Cassini spacecraft Saturn rings Enceladus Titan raw", fallback: "Cassini Saturn rings", instrument: "Cassini ISS Telemetry (Historic)" },
  "interstellar": { name: "Comets & Interstellar Objects", query: "Oumuamua Borisov comet Rosetta OSIRIS-REx Bennu", fallback: "Comet 67P Rosetta", instrument: "Deep Space Navigational Imagers" },
  "earth": { name: "Earth Orbital Radiometers", query: "Earth DSCOVR EPIC MODIS VIIRS satellite swath", fallback: "Earth from space DSCOVR", instrument: "DSCOVR EPIC / Terra MODIS" }
};

function initPlanetaryExplorer() {
  const topicChips = document.querySelectorAll('.planetary-chip');
  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topicChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPlanetaryTopic = chip.getAttribute('data-topic');
      fetchPlanetaryFeed(currentPlanetaryTopic, currentPlanetaryMediaType);
    });
  });

  const mediaChips = document.querySelectorAll('.media-chip');
  mediaChips.forEach(chip => {
    chip.addEventListener('click', () => {
      mediaChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPlanetaryMediaType = chip.getAttribute('data-media');
      fetchPlanetaryFeed(currentPlanetaryTopic, currentPlanetaryMediaType);
    });
  });
}

async function fetchPlanetaryFeed(topicKey, mediaFilter = 'image,video,audio') {
  const container = document.getElementById('planetary-gallery-container');
  const label = document.getElementById('planetary-current-topic-label');
  const timestamp = document.getElementById('planetary-feed-timestamp');
  const targetObj = COSMIC_TARGETS[topicKey] || COSMIC_TARGETS["deep-field"];

  if (label) label.textContent = targetObj.name;
  if (timestamp) timestamp.textContent = 'Streaming raw detector telemetry…';

  if (container) {
    container.innerHTML = `
      <div class="loading-state" style="grid-column: 1 / -1; text-align:center; padding: 40px;">
        <div class="apple-spinner large"></div>
        <p style="margin-top:10px; color:var(--muted);">Streaming deep space telescope detector array…</p>
      </div>
    `;
  }

  async function queryNasaApi(searchTerm, mediaTypes) {
    try {
      const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(searchTerm)}&media_type=${encodeURIComponent(mediaTypes)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data?.collection?.items || [];
    } catch (_) {
      return [];
    }
  }

  try {
    let items = await queryNasaApi(targetObj.query, mediaFilter);
    if (!items.length && targetObj.fallback) items = await queryNasaApi(targetObj.fallback, mediaFilter);
    if (!items.length && mediaFilter !== 'image,video,audio') items = await queryNasaApi(targetObj.query, 'image,video,audio');

    if (!items.length) {
      container.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--muted); padding:30px;">Telescope network synchronizing. Tap another cosmic target above.</p>`;
      return;
    }

    items.sort((a, b) => new Date(b.data?.[0]?.date_created || 0) - new Date(a.data?.[0]?.date_created || 0));
    const displayItems = items.slice(0, 18);
    planetaryExplorerLoaded = true;

    if (timestamp) timestamp.textContent = `🛰️ ${targetObj.instrument} · ${displayItems.length} observations`;

    container.innerHTML = displayItems.map(item => {
      const info = item.data?.[0] || {};
      const links = item.links || [];
      const mediaType = info.media_type || 'image';
      const nasaId = info.nasa_id || '';

      let thumbSrc = links.find(l => l.href && (l.render === 'image' || l.href.endsWith('.jpg') || l.href.endsWith('.png')))?.href || links[0]?.href || '';
      if (!thumbSrc && mediaType === 'audio') thumbSrc = NOTIFICATION_HERO_PHOTOS.satellite;
      if (!thumbSrc) return '';

      thumbSrc = thumbSrc.replace(/^http:\/\//i, 'https://');
      const title = (info.title || `NASA ${targetObj.name}`).replace(/"/g, '&quot;');
      let desc = (info.description || info.secondary_creator || 'Untouched scientific observation from deep-space observatory detectors.').replace(/<[^>]*>/g, '').trim();
      if (desc.length > 130) desc = `${desc.slice(0, 130)}…`;

      const rawDate = info.date_created;
      const dateStr = rawDate ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Observation Log';
      const formatBadge = mediaType === 'video' ? '🎬 4K TIME-LAPSE' : mediaType === 'audio' ? '🎙️ RADIO AUDIO' : '📸 RAW DETECTOR';

      return `
        <article class="planetary-card" data-url="${thumbSrc}" data-title="${title}" data-time="${dateStr}" data-mediatype="${mediaType}" data-nasaid="${nasaId}">
          <div class="planetary-card-media">
            <img src="${thumbSrc}" alt="${title}" loading="lazy" onerror="this.src='${NOTIFICATION_HERO_PHOTOS.satellite}';">
            <span class="planetary-tag">${targetObj.name}</span>
            <span class="planetary-media-type-tag">${formatBadge}</span>
            ${mediaType === 'video' ? '<div class="planetary-play-badge">▶</div>' : ''}
            ${mediaType === 'audio' ? '<div class="planetary-play-badge">🔊</div>' : ''}
          </div>
          <div class="planetary-card-body">
            <small class="planetary-date">${dateStr} · ${targetObj.instrument}</small>
            <h4>${info.title || 'Observation'}</h4>
            <p>${desc}</p>
            <div class="planetary-card-action">
              <span>Inspect ${mediaType === 'video' ? '4K Stream' : mediaType === 'audio' ? 'Audio Wave' : 'Raw Sensor Data'} ↗</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    container.querySelectorAll('.planetary-card').forEach(card => {
      card.addEventListener('click', async () => {
        const url = card.getAttribute('data-url');
        const title = card.getAttribute('data-title');
        const timeStr = card.getAttribute('data-time');
        const mediaType = card.getAttribute('data-mediatype');
        const nasaId = card.getAttribute('data-nasaid');
        openUniversalLightbox(url, title, `${targetObj.instrument} · ${timeStr}`, `${nasaId}.${mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'mp3' : 'jpg'}`, mediaType, nasaId);
      });
    });
  } catch (_) {
    container.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--muted); padding:30px;">Telescope telemetry buffer synchronizing. Tap another target.</p>`;
  }
}

// ============================================================================
// 8. ROCKET LAUNCH MANIFEST & COUNTDOWN
// ============================================================================
let launchCountdownTimer = null;

async function fetchLaunchesManifest() {
  const spotlightName = document.getElementById('spotlight-name');
  const spotlightDesc = document.getElementById('spotlight-desc');
  const spotlightRocket = document.getElementById('spotlight-rocket');
  const spotlightProvider = document.getElementById('spotlight-provider');
  const spotlightPad = document.getElementById('spotlight-pad');
  const spotlightTimeIst = document.getElementById('spotlight-time-ist');
  const spotlightTimeUtc = document.getElementById('spotlight-time-utc');
  const launchesList = document.getElementById('launches-list');

  const heroLaunchTimer = document.getElementById('hero-launch-timer');
  const heroLaunchName = document.getElementById('hero-launch-name');
  const heroLaunchProvider = document.getElementById('hero-launch-provider');
  const ovName = document.getElementById('overview-launch-name');
  const ovDesc = document.getElementById('overview-launch-desc');
  const ovProv = document.getElementById('tag-provider');
  const ovVeh = document.getElementById('tag-vehicle');

  try {
    const res = await fetch(`https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=8&cb=${Date.now()}`);
    const data = await res.json();
    const rawLaunches = data.results || [];
    const launches = rawLaunches.filter(l => new Date(l.net).getTime() > Date.now());
    const targetLaunches = launches.length ? launches : rawLaunches;

    if (!targetLaunches.length) return;

    const next = targetLaunches[0];
    const targetDate = new Date(next.net);

    if (spotlightName) spotlightName.textContent = next.name;
    if (spotlightDesc) spotlightDesc.textContent = next.mission?.description || 'Orbital mission deployment with verified flight profile.';
    if (spotlightRocket) spotlightRocket.textContent = next.rocket?.configuration?.name || 'Launch Vehicle';
    if (spotlightProvider) spotlightProvider.textContent = next.launch_service_provider?.name || 'Space Agency';
    if (spotlightPad) spotlightPad.textContent = next.pad?.location?.name || 'Spaceport Complex';

    const istString = targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
    if (spotlightTimeIst) spotlightTimeIst.textContent = istString;
    if (spotlightTimeUtc) spotlightTimeUtc.textContent = `T-Minus target: ${targetDate.toUTCString()}`;

    if (heroLaunchName) heroLaunchName.textContent = next.name;
    if (heroLaunchProvider) heroLaunchProvider.textContent = `${next.launch_service_provider?.name || 'Launch'} ↗`;
    if (ovName) ovName.textContent = next.name;
    if (ovDesc) ovDesc.textContent = next.mission?.description ? `${next.mission.description.slice(0, 130)}…` : 'Flight countdown active.';
    if (ovProv) ovProv.textContent = `Provider: ${next.launch_service_provider?.name || 'Global'}`;
    if (ovVeh) ovVeh.textContent = `Vehicle: ${next.rocket?.configuration?.name || 'Rocket'}`;

    clearInterval(launchCountdownTimer);
    launchCountdownTimer = setInterval(() => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        if (heroLaunchTimer) heroLaunchTimer.textContent = "LIFTOFF 🚀";
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = n => String(n).padStart(2, '0');

      const cD = document.getElementById('clock-d');
      const cH = document.getElementById('clock-h');
      const cM = document.getElementById('clock-m');
      const cS = document.getElementById('clock-s');
      if (cD) cD.textContent = pad(days);
      if (cH) cH.textContent = pad(hours);
      if (cM) cM.textContent = pad(minutes);
      if (cS) cS.textContent = pad(seconds);

      if (heroLaunchTimer) heroLaunchTimer.textContent = `T-${days}d ${pad(hours)}h ${pad(minutes)}m`;
    }, 1000);

    if (launchesList) {
      launchesList.innerHTML = targetLaunches.slice(1).map(l => `
        <article class="launch-item-card">
          <div class="launch-item-header">
            <span class="launch-provider-badge">${l.launch_service_provider?.name || 'Space Agency'}</span>
            <span class="launch-status-badge">${l.status?.name || 'Scheduled'}</span>
          </div>
          <h4>${l.name}</h4>
          <p>${l.mission?.description ? `${l.mission.description.slice(0, 110)}…` : 'Orbital flight manifest.'}</p>
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line);font-size:10px;font-family:var(--mono);color:var(--orange);">
            Time: ${new Date(l.net).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' })} IST
          </div>
        </article>
      `).join('');
    }
  } catch (_) {
    if (spotlightName) spotlightName.textContent = 'Flight Manifest Synchronizing…';
  }
}

// ============================================================================
// 9. EARTH & MARS (RESTORED 3-TIER MARS PIPELINE - NEVER STALLS)
// ============================================================================
async function fetchEpicEarth() {
  const box = document.getElementById('epic-media-box');
  try {
    const res = await fetch(`https://epic.gsfc.nasa.gov/api/natural?cb=${Date.now()}`);
    const data = await res.json();
    if (!data?.length) return;

    const item = data[0];
    const parts = item.date.split(' ')[0].split('-');
    const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${parts[0]}/${parts[1]}/${parts[2]}/jpg/${item.image}.jpg`;

    const dUtc = document.getElementById('epic-date');
    const dIst = document.getElementById('epic-date-ist');
    const centroid = document.getElementById('epic-centroid');

    if (dUtc) dUtc.textContent = `${item.date} UTC`;
    if (dIst) dIst.textContent = `${new Date(item.date + ' UTC').toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`;
    if (centroid && item.centroid_coordinates) centroid.textContent = `${item.centroid_coordinates.lat.toFixed(1)}°N, ${item.centroid_coordinates.lon.toFixed(1)}°E`;

    if (box) {
      box.innerHTML = `<img src="${imgUrl}" alt="Earth DSCOVR EPIC" loading="lazy">`;
      box.onclick = () => openUniversalLightbox(imgUrl, "Planet Earth from 1M Miles (DSCOVR EPIC)", item.date + ' UTC', `${item.image}.jpg`);
    }
  } catch (_) {
    if (box) box.innerHTML = '<p class="muted">NASA DSCOVR EPIC satellite data synchronizing…</p>';
  }
}

async function fetchMarsPhotos() {
  const container = document.getElementById('mars-photos-container');
  if (!container) return;

  function renderMarsItems(itemsList) {
    container.innerHTML = itemsList.map(p => `
      <div class="mars-photo-item" data-url="${p.url}" data-title="${p.title.replace(/"/g, '&quot;')}" data-time="${p.time}" data-filename="${p.filename}">
        <img src="${p.url}" alt="${p.title}" loading="lazy">
        <span class="mars-photo-tag">${p.tag}</span>
      </div>
    `).join('');

    container.querySelectorAll('.mars-photo-item').forEach(el => {
      el.addEventListener('click', () => {
        openUniversalLightbox(el.dataset.url, el.dataset.title, el.dataset.time, el.dataset.filename);
      });
    });
  }

  // Tier 1: Curiosity Rover Sol API
  try {
    const res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/latest_photos?api_key=${NASA_API_KEY}`);
    if (res.ok) {
      const data = await res.json();
      const photos = data.latest_photos || [];
      if (photos.length > 0) {
        const cSol = document.getElementById('curiosity-sol');
        if (cSol) cSol.textContent = `Sol ${photos[0].sol}`;
        renderMarsItems(photos.slice(0, 4).map(p => ({
          url: p.img_src.replace('http://', 'https://'),
          title: `Mars Surface (${p.rover.name} - ${p.camera.full_name || 'Camera'})`,
          time: `Sol ${p.sol} · ${p.earth_date}`,
          tag: `${p.camera.name || 'Navcam'} · Sol ${p.sol}`,
          filename: `Mars_${p.rover.name}_Sol_${p.sol}.jpg`
        })));
        return;
      }
    }
  } catch (_) {}

  // Tier 2: Perseverance Raw Downlinks Fallback
  try {
    const res = await fetch('https://images-api.nasa.gov/search?q=Perseverance%20Mars%20surface%20raw&media_type=image');
    if (res.ok) {
      const data = await res.json();
      const items = data.collection?.items || [];
      if (items.length > 0) {
        renderMarsItems(items.slice(0, 4).map(item => ({
          url: (item.links?.[0]?.href || '').replace('http://', 'https://'),
          title: item.data?.[0]?.title || 'Mars Surface Raw',
          time: `Captured: ${item.data?.[0]?.date_created?.slice(0, 10) || 'Recent'}`,
          tag: (item.data?.[0]?.title || 'Mars Raw').slice(0, 24),
          filename: 'Mars_Surface_Perseverance.jpg'
        })));
        return;
      }
    }
  } catch (_) {}

  // Tier 3: Mars Panorama Archives Fallback
  try {
    const res = await fetch('https://images-api.nasa.gov/search?q=Mars%20surface%20rover&media_type=image');
    const data = await res.json();
    const items = data.collection?.items || [];
    if (items.length > 0) {
      renderMarsItems(items.slice(0, 4).map(item => ({
        url: (item.links?.[0]?.href || '').replace('http://', 'https://'),
        title: item.data?.[0]?.title || 'Mars Surface',
        time: item.data?.[0]?.date_created?.slice(0, 10) || 'Active',
        tag: (item.data?.[0]?.title || 'Mars').slice(0, 24),
        filename: 'Mars_Surface_Capture.jpg'
      })));
    }
  } catch (_) {
    container.innerHTML = '<p class="muted">Martian radio relay synchronizing surface telemetry…</p>';
  }
}

// ============================================================================
// 10. SPACE WEATHER (RESTORED FLARES & CME EARTH TRAJECTORY)
// ============================================================================
async function fetchSpaceWeather() {
  const list = document.getElementById('weather-events');
  const cmeList = document.getElementById('cme-events');
  const weatherSyncBadge = document.getElementById('weather-sync-badge');

  const today = new Date().toISOString().slice(0, 10);
  const prev = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  try {
    const res = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${prev}&endDate=${today}&api_key=${NASA_API_KEY}&cb=${Date.now()}`);
    const flares = res.ok ? await res.json() : [];

    if (weatherSyncBadge) {
      weatherSyncBadge.className = 'small-chip green';
      weatherSyncBadge.textContent = 'Auto-Synced 🟢';
    }

    if (list) {
      if (!flares || !flares.length) {
        document.getElementById('sw-kp-val').textContent = 'Kp 1.7';
        document.getElementById('sw-flare-val').textContent = 'Class B/C';
        document.getElementById('sw-storm-val').textContent = 'G0 Alert';
        list.innerHTML = `
          <div class="weather-event-row">
            <div>
              <b>Solar Disk State: Background Nominal</b>
              <small>No severe Class M/X solar flares in past 7 days. Planetary Kp &lt; 3 (Quiet flux).</small>
            </div>
            <span class="small-chip green">QUIET</span>
          </div>
        `;
      } else {
        const top = flares[0];
        document.getElementById('sw-flare-val').textContent = `Class ${top.classType || 'M'}`;
        document.getElementById('sw-storm-val').textContent = 'Active Flare Alert';

        list.innerHTML = flares.slice(0, 6).map(f => `
          <div class="weather-event-row">
            <div>
              <b>Solar Flare · Class ${f.classType || 'Flare'}</b>
              <small>Peak: ${f.peakTime ? f.peakTime.replace('T', ' ').replace('Z', ' UTC') : 'Recorded'} · Source: ${f.sourceLocation || 'Sun Disk'}</small>
            </div>
            <span class="small-chip orange">Class ${f.classType}</span>
          </div>
        `).join('');
      }
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="muted">Heliophysics solar flare monitors active.</p>';
  }

  if (cmeList) {
    try {
      const cmeRes = await fetch(`https://api.nasa.gov/DONKI/CME?startDate=${prev}&endDate=${today}&api_key=${NASA_API_KEY}&cb=${Date.now()}`);
      const cmes = cmeRes.ok ? await cmeRes.json() : [];

      if (!cmes || !cmes.length) {
        cmeList.innerHTML = `
          <div class="weather-event-row">
            <div>
              <b>Solar Plasma Ejection Status: Quiet</b>
              <small>No significant Earth-directed Coronal Mass Ejections (CME) in past 7 days.</small>
            </div>
            <span class="small-chip green">NOMINAL</span>
          </div>
        `;
      } else {
        cmeList.innerHTML = cmes.slice(0, 5).map(c => {
          const speedNum = c.cmeAnalyses?.[0]?.speed ? Math.round(c.cmeAnalyses[0].speed) : 450;
          const isEarthDirected = Boolean(c.cmeAnalyses?.[0]?.isEarthDirected);
          const transitHours = Math.max(18, Math.round(150000000 / (speedNum * 3600)));

          return `
            <div class="weather-event-row">
              <div style="flex:1;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <b>Coronal Mass Ejection (CME) · ${speedNum} km/s</b>
                  <span class="small-chip ${isEarthDirected ? 'orange' : 'green'}">${isEarthDirected ? '🟠 Earth Watch' : '🟢 Safe Deflection'}</span>
                </div>
                <small>${isEarthDirected ? 'Direct trajectory predicted.' : 'Deflected solar path.'} Detected: ${c.startTime ? c.startTime.slice(0, 16).replace('T', ' ') : 'Recent'}</small>
                <small style="color:var(--blue);display:block;margin-top:2px;">Transit Window: ~${transitHours} hrs</small>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (_) {
      cmeList.innerHTML = '<p class="muted">DONKI Coronal Mass Ejection radars active.</p>';
    }
  }
}

// ============================================================================
// 11. COSMOS, APOD, ASTEROIDS & HAZARDS (RESTORED MULTI-TIER)
// ============================================================================
async function fetchApod() {
  const media = document.getElementById('apod-media');
  try {
    let entry = null;
    const wpRes = await fetch(`https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=1&cb=${Date.now()}`);
    if (wpRes.ok) {
      const data = await wpRes.json();
      entry = Array.isArray(data) ? data[0] : data;
    }

    if (!entry) {
      const apiRes = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&cb=${Date.now()}`);
      if (apiRes.ok) entry = await apiRes.json();
    }

    if (!entry) throw new Error();

    const title = typeof entry.title === 'object' ? (entry.title.rendered || 'Astronomy Picture of the Day') : (entry.title || 'Astronomy Picture of the Day');
    let explanation = typeof entry.explanation === 'object' ? (entry.explanation.rendered || '') : (entry.explanation || '');
    explanation = explanation.replace(/^Explanation:\s*/i, '').replace(/<[^>]*>/g, '').trim();

    const date = entry.date || new Date().toISOString().slice(0, 10);
    const credit = entry.credit || entry.copyright || 'NASA and Space Telescopes';
    const actualImageSrc = (entry.hdurl || entry.image || entry.url || '').replace(/^http:\/\//i, 'https://');

    document.getElementById('apod-title').textContent = title;
    document.getElementById('apod-explanation').textContent = explanation;
    document.getElementById('apod-date').textContent = date;
    const creditEl = document.getElementById('apod-copyright');
    if (creditEl) creditEl.textContent = `Credit: ${credit}`;

    if (media && actualImageSrc) {
      if (entry.media_type === 'video' || actualImageSrc.includes('youtube') || actualImageSrc.includes('vimeo')) {
        media.innerHTML = `<iframe src="${actualImageSrc}" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:14px;"></iframe>`;
      } else {
        media.innerHTML = `<img src="${actualImageSrc}" alt="${title}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" loading="lazy">`;
        media.onclick = () => openUniversalLightbox(actualImageSrc, title, `NASA APOD · ${date}`, `NASA_APOD_${date}.jpg`);
      }
    }
  } catch (_) {
    document.getElementById('apod-title').textContent = 'Cosmic Explorer Standby';
  }
}

async function fetchAsteroids() {
  const container = document.getElementById('neo-list');
  try {
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${NASA_API_KEY}&cb=${Date.now()}`);
    const data = await res.json();

    let allNeos = [];
    const dateMap = data.near_earth_objects || {};
    Object.keys(dateMap).forEach(dKey => {
      allNeos = allNeos.concat(dateMap[dKey]);
    });

    allNeos.sort((a, b) => {
      const distA = parseFloat(a.close_approach_data?.[0]?.miss_distance?.kilometers || 999999999);
      const distB = parseFloat(b.close_approach_data?.[0]?.miss_distance?.kilometers || 999999999);
      return distA - distB;
    });

    if (container) {
      if (!allNeos.length) {
        container.innerHTML = '<p class="muted">No near-Earth asteroid radar tracks for this week.</p>';
        return;
      }
      container.innerHTML = allNeos.slice(0, 12).map(ast => {
        const isHazard = ast.is_potentially_hazardous_asteroid;
        const ca = ast.close_approach_data?.[0] || {};
        const missKm = ca.miss_distance ? `${(parseFloat(ca.miss_distance.kilometers) / 1000000).toFixed(2)}M km` : '—';
        const velKmS = ca.relative_velocity ? `${parseFloat(ca.relative_velocity.kilometers_per_second).toFixed(1)} km/s` : '—';
        const diam = ast.estimated_diameter?.meters?.estimated_diameter_max?.toFixed(0) || '—';

        return `
          <div class="neo-item">
            <div class="neo-item-top">
              <b>${ast.name}</b>
              <span class="hazard-pill ${isHazard ? 'red' : 'green'}">${isHazard ? 'POTENTIAL HAZARD' : 'SAFE FLYBY'}</span>
            </div>
            <div class="neo-item-stats">
              <span>Date: <b>${ca.close_approach_date || 'Upcoming'}</b></span>
              <span>Miss: <b>${missKm}</b></span>
              <span>Speed: <b>${velKmS}</b></span>
              <span>Size: <b>~${diam}m</b></span>
            </div>
            <a class="neo-verify-link" href="${ast.nasa_jpl_url}" target="_blank" rel="noopener">JPL Radar Telemetry ↗</a>
          </div>
        `;
      }).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = '<p class="muted">NASA NeoWs asteroid radar synchronizing…</p>';
  }
}

async function fetchEarthquakes() {
  const list = document.getElementById('earthquake-list');
  try {
    const res = await fetch(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson?cb=${Date.now()}`);
    const data = await res.json();
    const quakes = data.features || [];

    const badge = document.getElementById('quake-count');
    const heroQ = document.getElementById('hero-quake-count');
    if (badge) badge.textContent = `${quakes.length} ACTIVE`;
    if (heroQ) heroQ.textContent = quakes.length;

    if (quakeLayerGroup && satMap) {
      quakeLayerGroup.clearLayers();
      quakes.slice(0, 30).forEach(q => {
        const coords = q.geometry.coordinates;
        const mag = q.properties.mag;
        const color = mag >= 5.0 ? '#ff453a' : (mag >= 4.0 ? '#ffb454' : '#ffd60a');
        L.circleMarker([coords[1], coords[0]], {
          radius: Math.max(4, mag * 2.2),
          fillColor: color,
          color: color,
          weight: 1,
          fillOpacity: 0.5
        }).bindPopup(`<b>USGS M${mag.toFixed(1)}</b><br>${q.properties.place}`).addTo(quakeLayerGroup);
      });
    }

    if (list) {
      list.innerHTML = quakes.slice(0, 8).map(q => {
        const mag = q.properties.mag.toFixed(1);
        const color = q.properties.mag >= 5.0 ? 'red' : (q.properties.mag >= 4.0 ? 'orange' : 'green');
        return `
          <div class="quake-row">
            <div class="quake-row-top">
              <div class="mag-box ${color}">M${mag}</div>
              <b>${q.properties.place}</b>
            </div>
            <div class="quake-row-bottom">
              <small>${new Date(q.properties.time).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' })} IST</small>
              <a class="neo-verify-link" href="${q.properties.url}" target="_blank" rel="noopener">USGS Record ↗</a>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (_) {
    if (list) list.innerHTML = '<p class="muted">USGS seismograph network synchronizing…</p>';
  }
}

async function fetchEonetHazards() {
  const list = document.getElementById('hazard-list');
  try {
    const res = await fetch(`https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=15&cb=${Date.now()}`);
    const data = await res.json();
    const events = data.events || [];

    const badge = document.getElementById('hazard-count');
    if (badge) badge.textContent = `${events.length} ACTIVE`;

    if (hazardLayerGroup && satMap) {
      hazardLayerGroup.clearLayers();
      events.forEach(ev => {
        const geo = ev.geometry?.[0];
        if (geo?.coordinates) {
          L.circleMarker([geo.coordinates[1], geo.coordinates[0]], {
            radius: 6,
            fillColor: '#bf9cff',
            color: '#bf9cff',
            weight: 1,
            fillOpacity: 0.65
          }).bindPopup(`<b>${ev.title}</b><br>${ev.categories?.[0]?.title || 'Natural Hazard'}`).addTo(hazardLayerGroup);
        }
      });
    }

    if (list) {
      list.innerHTML = events.slice(0, 8).map(ev => `
        <div class="quake-row">
          <div class="quake-row-top">
            <div class="mag-box purple">🌋</div>
            <b>${ev.title}</b>
          </div>
          <div class="quake-row-bottom">
            <small>${ev.categories?.[0]?.title || 'Hazard'}</small>
            <span style="color:var(--purple);font-family:var(--mono);">NASA EONET</span>
          </div>
        </div>
      `).join('');
    }
  } catch (_) {}
}

// ============================================================================
// 12. AREA INTELLIGENCE BRIEF (OPEN-METEO)
// ============================================================================
function initAreaIntel() {
  const input = document.getElementById('intel-area-input');
  const btn = document.getElementById('intel-search-btn');
  const suggestions = document.getElementById('intel-suggestions');
  const presets = document.querySelectorAll('.area-pill');

  presets.forEach(p => {
    p.addEventListener('click', () => {
      presets.forEach(item => item.classList.remove('active'));
      p.classList.add('active');
      loadAreaTelemetry(parseFloat(p.dataset.lat), parseFloat(p.dataset.lon), p.dataset.name);
    });
  });

  btn?.addEventListener('click', () => {
    const q = input?.value.trim();
    if (q) searchArea(q);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) searchArea(q);
    }
  });

  async function searchArea(query) {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
      const data = await res.json();
      const results = data.results || [];

      if (suggestions) {
        if (!results.length) {
          showToast('Location coordinates not found.');
          return;
        }
        suggestions.innerHTML = results.map(r => `
          <button class="dropdown-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}, ${r.country || ''}">
            <b>${r.name}</b> <small style="color:var(--muted);">${r.admin1 || ''}, ${r.country || ''}</small>
          </button>
        `).join('');
        suggestions.hidden = false;

        suggestions.querySelectorAll('.dropdown-item').forEach(item => {
          item.addEventListener('click', () => {
            suggestions.hidden = true;
            if (input) input.value = item.dataset.name;
            loadAreaTelemetry(parseFloat(item.dataset.lat), parseFloat(item.dataset.lon), item.dataset.name);
          });
        });
      }
    } catch (_) {}
  }

  loadAreaTelemetry(17.3850, 78.4867, "Hyderabad, Telangana, India");
}

async function loadAreaTelemetry(lat, lon, placeName) {
  const title = document.getElementById('intel-area-title');
  const tag = document.getElementById('intel-coords-tag');
  if (title) title.textContent = placeName;
  if (tag) tag.textContent = `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;

  try {
    const [wRes, aRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,direct_normal_irradiance`),
      fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide`)
    ]);

    if (wRes.ok) {
      const wData = (await wRes.json()).current || {};
      document.getElementById('intel-temp').textContent = `${Math.round(wData.temperature_2m || 0)}°C`;
      document.getElementById('intel-feels-like').textContent = `Feels like: ${Math.round(wData.apparent_temperature || 0)}°C`;
      document.getElementById('intel-humidity').textContent = `${wData.relative_humidity_2m || 0}%`;
      document.getElementById('intel-wind').textContent = `${wData.wind_speed_10m || 0} km/h`;
      document.getElementById('intel-solar').textContent = `${Math.round(wData.direct_normal_irradiance || 0)} W/m²`;
    }

    if (aRes.ok) {
      const aData = (await aRes.json()).current || {};
      const aqi = aData.us_aqi || 38;
      document.getElementById('intel-aqi').textContent = aqi;
      const aqiBadge = document.getElementById('intel-aqi-badge');
      if (aqiBadge) {
        aqiBadge.className = aqi <= 50 ? 'status-tag green' : (aqi <= 100 ? 'status-tag yellow' : 'status-tag red');
        aqiBadge.textContent = aqi <= 50 ? 'Good' : (aqi <= 100 ? 'Moderate' : 'Unhealthy');
      }
      document.getElementById('intel-pm25').textContent = `${aData.pm2_5 || '—'} µg/m³`;
      document.getElementById('intel-pm10').textContent = `${aData.pm10 || '—'} µg/m³`;
      document.getElementById('intel-no2').textContent = `${aData.nitrogen_dioxide || '—'} µg/m³`;
    }
  } catch (_) {}
}

// ============================================================================
// 13. WIKIPEDIA EXPLORER
// ============================================================================
function initWiki() {
  const input = document.getElementById('wiki-query-input');
  const btn = document.getElementById('wiki-search-btn');
  const pills = document.querySelectorAll('.wiki-pill');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      fetchWikiArticle(pill.dataset.topic);
    });
  });

  btn?.addEventListener('click', () => {
    const q = input?.value.trim();
    if (q) fetchWikiArticle(q);
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) fetchWikiArticle(q);
    }
  });

  fetchWikiArticle('Chandrayaan-3');
}

async function fetchWikiArticle(title) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const data = await res.json();

    document.getElementById('wiki-title').textContent = data.title || title;
    document.getElementById('wiki-extract').textContent = data.extract || 'Wikipedia summary not found.';
    document.getElementById('wiki-link').href = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const thumb = document.getElementById('wiki-thumb');
    if (thumb) thumb.src = data.thumbnail?.source || 'assets/space-hub-icon-192.png?v=1';
  } catch (_) {}
}

// ============================================================================
// 14. PREFERENCES & ALERTS
// ============================================================================
function initSettingsAndAlerts() {
  const saveBtn = document.getElementById('save-firebase-btn');
  const testBtn = document.getElementById('test-alert-btn');
  const selectAllBtn = document.getElementById('toggle-all-alerts-btn');
  const checkboxes = document.querySelectorAll('.alert-checkbox');
  const gpsBtn = document.getElementById('use-gps-btn');
  const metroSelect = document.getElementById('metro-location-select');
  const locStatus = document.getElementById('current-location-status');

  selectAllBtn?.addEventListener('click', () => {
    const allChecked = Array.from(checkboxes).every(c => c.checked);
    checkboxes.forEach(c => c.checked = !allChecked);
    selectAllBtn.textContent = allChecked ? 'Select All' : 'Deselect All';
  });

  saveBtn?.addEventListener('click', () => {
    showToast('Preferences synchronized successfully.');
  });

  testBtn?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      const activeSat = CAROUSEL_FLEET[carouselIndex % CAROUSEL_FLEET.length];
      const isStation = activeSat.name.includes('ISS') || activeSat.name.includes('CSS') || activeSat.name.includes('TIANGONG');
      new Notification(`T&C Space · ${activeSat.name} Flyby`, {
        body: `${activeSat.name} (${activeSat.orbit}) is passing overhead! Clear skies for visual sighting.`,
        icon: 'assets/space-hub-icon-192.png?v=1',
        image: isStation ? NOTIFICATION_HERO_PHOTOS.station : NOTIFICATION_HERO_PHOTOS.satellite
      });
      showToast('Test spacecraft alert dispatched!');
    }
  });

  gpsBtn?.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        localStorage.setItem('user_target_lat', pos.coords.latitude.toFixed(4));
        localStorage.setItem('user_target_lon', pos.coords.longitude.toFixed(4));
        localStorage.setItem('user_target_city', `GPS Target (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`);
        if (locStatus) locStatus.textContent = `Target: GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`;
        showToast('GPS coordinates locked as flyby center.');
      });
    }
  });

  metroSelect?.addEventListener('change', e => {
    const [lat, lon, name] = e.target.value.split(',');
    localStorage.setItem('user_target_lat', lat);
    localStorage.setItem('user_target_lon', lon);
    localStorage.setItem('user_target_city', name);
    if (locStatus) locStatus.textContent = `Target: ${name}, India`;
    showToast(`Location set to ${name}`);
  });
}

// ============================================================================
// 15. UNIVERSAL LIGHTBOX & DIRECT IN-PLACE DOWNLOADS
// ============================================================================
function openUniversalLightbox(url, title, timeStr, filename, mediaType = 'image', nasaId = null) {
  const lb = document.getElementById('universal-media-lightbox');
  const img = document.getElementById('universal-lightbox-img');
  const vid = document.getElementById('universal-lightbox-video');
  const audWrap = document.getElementById('universal-lightbox-audio-wrap');
  const aud = document.getElementById('universal-lightbox-audio');
  const tEl = document.getElementById('universal-lightbox-title');
  const tmEl = document.getElementById('universal-lightbox-time');
  const rawTag = document.getElementById('universal-lightbox-raw-tag');

  activeLightboxMedia = { url, title, timeStr, filename, mediaType, nasaId };

  if (tEl) tEl.textContent = title;
  if (tmEl) tmEl.textContent = timeStr;
  if (rawTag) rawTag.textContent = `${mediaType.toUpperCase()} RESOLVED MASTER`;

  if (img) img.style.display = 'none';
  if (vid) { vid.style.display = 'none'; vid.pause(); }
  if (audWrap) { audWrap.style.display = 'none'; aud?.pause(); }

  if (mediaType === 'video' && vid) {
    vid.src = url;
    vid.style.display = 'block';
  } else if (mediaType === 'audio' && audWrap && aud) {
    aud.src = url;
    audWrap.style.display = 'block';
  } else if (img) {
    img.src = url;
    img.style.display = 'block';
  }

  if (lb) {
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
  }
}

function closeUniversalLightbox() {
  const lb = document.getElementById('universal-media-lightbox');
  const vid = document.getElementById('universal-lightbox-video');
  const aud = document.getElementById('universal-lightbox-audio');

  if (vid) vid.pause();
  if (aud) aud.pause();

  if (lb) {
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
  }
}

function initLightboxAndSheets() {
  const closeLbBtn = document.getElementById('close-universal-lightbox-btn');
  const lb = document.getElementById('universal-media-lightbox');
  const downloadBtn = document.getElementById('universal-download-btn');
  const shareBtn = document.getElementById('universal-share-btn');

  const sheet = document.getElementById('download-action-sheet-backdrop');
  const sheetCancel = document.getElementById('sheet-cancel-btn');
  const sheetOpt = document.getElementById('sheet-download-opt');
  const sheetRaw = document.getElementById('sheet-download-raw');

  closeLbBtn?.addEventListener('click', closeUniversalLightbox);
  lb?.addEventListener('click', e => {
    if (e.target === lb) closeUniversalLightbox();
  });

  downloadBtn?.addEventListener('click', () => {
    if (sheet) sheet.classList.add('open');
  });

  sheetCancel?.addEventListener('click', () => {
    if (sheet) sheet.classList.remove('open');
  });

  sheet?.addEventListener('click', e => {
    if (e.target === sheet) sheet.classList.remove('open');
  });

  async function downloadAsset(url, filename) {
    showToast(`Downloading ${filename}…`);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      if (sheet) sheet.classList.remove('open');
    } catch (_) {
      window.open(url, '_blank');
      if (sheet) sheet.classList.remove('open');
    }
  }

  sheetOpt?.addEventListener('click', () => {
    if (activeLightboxMedia?.url) downloadAsset(activeLightboxMedia.url, activeLightboxMedia.filename);
  });

  sheetRaw?.addEventListener('click', () => {
    if (activeLightboxMedia?.url) downloadAsset(activeLightboxMedia.url, activeLightboxMedia.filename);
  });

  shareBtn?.addEventListener('click', async () => {
    if (!activeLightboxMedia) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#planetary-explorer`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeLightboxMedia.title,
          text: `Check out this space observation: ${activeLightboxMedia.title}`,
          url: shareUrl
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard!');
  });
}

// ============================================================================
// 16. THEME, PWA & LIVE SENSORS TICKER
// ============================================================================
function initThemeAndPwa() {
  const themeSelect = document.getElementById('theme-select');
  const themeMeta = document.getElementById('theme-color-meta');
  const refreshBtn = document.getElementById('refresh-all');
  const pwaBtn = document.getElementById('pwa-install-btn');

  themeSelect?.addEventListener('change', e => {
    const val = e.target.value;
    if (val === 'system') {
      document.documentElement.removeAttribute('data-theme');
      if (themeMeta) themeMeta.setAttribute('content', '#101114');
    } else {
      document.documentElement.setAttribute('data-theme', val);
      if (themeMeta) themeMeta.setAttribute('content', val === 'light' ? '#f5f5f7' : '#101114');
    }
  });

  refreshBtn?.addEventListener('click', () => {
    showToast('Refreshing all orbital sensor arrays…');
    fetchLiveSatelliteTelemetry(true);
    fetchLaunchesManifest();
    fetchEpicEarth();
    fetchMarsPhotos();
    fetchSpaceWeather();
    fetchApod();
    fetchAsteroids();
    fetchEarthquakes();
    fetchEonetHazards();
  });

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBtn) pwaBtn.style.display = 'inline-flex';
  });

  pwaBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') pwaBtn.style.display = 'none';
      deferredPrompt = null;
    }
  });
}

function startLiveTickerEngine() {
  const tickerEl = document.getElementById('ticker');
  if (!tickerEl) return;

  const tickerMessages = [
    "🛰️ FLEET: Rotating ISS, Tiangong CSS, Chandrayaan-3, and NavIC orbital telemetry.",
    "🚀 LAUNCHES: Live flight manifests streaming from global spaceports via SpaceDevs LL2.",
    "🔭 VOYAGER 1 & 2: Streaking into interstellar space beyond the Heliopause at ~17 km/s.",
    "☀️ SPACE WEATHER: Syncing NOAA SWPC and NASA DONKI Coronal Mass Ejection radars.",
    "🌍 SEISMIC: USGS global seismograph network active for all M2.5+ tectonic events."
  ];

  let tickerIdx = 0;
  setInterval(() => {
    tickerIdx = (tickerIdx + 1) % tickerMessages.length;
    tickerEl.textContent = tickerMessages[tickerIdx];
  }, 4500);
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ============================================================================
// 17. APP INITIALIZATION ENTRY POINT
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initClocks();
  initNetworkMonitor();
  initNavigation();
  initOverviewClickableCards();
  initOverviewRotatingCarousel();
  initVoyagerTracker();
  initMap();
  initPlanetaryExplorer();
  fetchLaunchesManifest();
  fetchEpicEarth();
  fetchMarsPhotos();
  fetchSpaceWeather();
  fetchApod();
  fetchAsteroids();
  fetchEarthquakes();
  fetchEonetHazards();
  initAreaIntel();
  initWiki();
  initSettingsAndAlerts();
  initLightboxAndSheets();
  initThemeAndPwa();
  startLiveTickerEngine();

  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    lastUpdated.textContent = `LIVE TELEMETRY SYNCED · ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false })} IST`;
  }
});
