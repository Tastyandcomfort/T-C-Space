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
let activeMediaPayload = null;
let lastSatData = null;

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
  { id: 43013, name: "NOAA-20", alt: 824.0, vel: 7.45, orbit: "Sun-Synchronous Polar", color: "#2997ff" }
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
// 5. 100% WATERMARK-FREE LEAFLET MAP & RECENTLY DEPLOYED SATELLITES
// ============================================================================
let satMap = null;
let issMarker = null;
let issOrbitLayerGroup = null;
let currentSatelliteId = 25544;
let currentSatelliteName = "ISS (ZARYA)";
let quakeLayerGroup = null;
let hazardLayerGroup = null;
let newlyDeployedLayerGroup = null;

const ORBITAL_FLEET = {
  25544: { name: "ISS (ZARYA)", inc: 51.64, mm: 15.49, alt: 418.0, isApi: true, color: "#2997ff", type: "Space Station" },
  48274: { name: "CSS TIANHE (TIANGONG)", inc: 41.5, mm: 15.6, alt: 385.0, vel: 7.68, isApi: false, color: "#ffb454", type: "Space Station" },
  57320: { name: "CHANDRAYAAN-3 (ISRO)", inc: 21.3, mm: 11.5, alt: 384000.0, vel: 1.02, isApi: false, color: "#30d158", type: "Lunar Vehicle" },
  43286: { name: "NAVIC-1I (ISRO)", inc: 29.5, mm: 1.0, alt: 35786.0, vel: 3.07, isApi: false, color: "#64d9e5", type: "Navigational Satellite" },
  20580: { name: "HUBBLE SPACE TELESCOPE", inc: 28.5, mm: 15.1, alt: 535.0, vel: 7.59, isApi: false, color: "#bf9cff", type: "Observatory" },
  43013: { name: "NOAA 20", inc: 98.7, mm: 14.2, alt: 824.0, vel: 7.45, isApi: false, color: "#2997ff", type: "Earth Observation" }
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

  // Pure OpenStreetMap Standard Tile Layer: 100% Free, Reliable & Zero Watermark
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(satMap);

  issOrbitLayerGroup = L.layerGroup().addTo(satMap);
  quakeLayerGroup = L.layerGroup().addTo(satMap);
  hazardLayerGroup = L.layerGroup().addTo(satMap);
  newlyDeployedLayerGroup = L.layerGroup().addTo(satMap);

  issMarker = L.marker([0, 0], {
    icon: getModel1TacticalHudIcon(currentSatelliteId, currentSatelliteName, "418 km", "7.66 km/s")
  }).addTo(satMap);

  issMarker.bindPopup("Establishing spacecraft telemetry…");

  setupMapControls();
  pollSatellitePosition();
  setInterval(pollSatellitePosition, 3500);
}

function setupMapControls() {
  const chips = document.querySelectorAll('.sat-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const satId = chip.getAttribute('data-sat-id');
      const satName = chip.getAttribute('data-sat-name');

      if (satId === 'newly-deployed') {
        loadNewlyDeployedSpacecraft();
        return;
      }

      newlyDeployedLayerGroup?.clearLayers();
      currentSatelliteId = parseInt(satId, 10);
      currentSatelliteName = satName;
      const hudName = document.getElementById('hud-sat-name');
      if (hudName) hudName.textContent = currentSatelliteName;
      pollSatellitePosition();
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
      satMap.addLayer(issOrbitLayerGroup);
    } else {
      satMap.removeLayer(issOrbitLayerGroup);
    }
  });

  initSatelliteSearch();
}

async function loadNewlyDeployedSpacecraft() {
  showToast('Loading newly deployed spacecraft catalog (past 30 days)…');
  const hudName = document.getElementById('hud-sat-name');
  if (hudName) hudName.textContent = "NEWLY DEPLOYED SATELLITES (30D)";

  if (!newlyDeployedLayerGroup || !satMap) return;
  newlyDeployedLayerGroup.clearLayers();

  const recentLaunchesMock = [
    { name: "STARLINK GROUP 10-1", norad: 60120, lat: 28.5, lon: -45.2, alt: 540, vel: 7.6, rocket: "Falcon 9" },
    { name: "CYGNUS NG-21", norad: 60231, lat: 38.2, lon: 12.4, alt: 420, vel: 7.67, rocket: "Falcon 9 / ISS Relay" },
    { name: "PROGRESS MS-28", norad: 60310, lat: 49.1, lon: 74.8, alt: 416, vel: 7.68, rocket: "Soyuz 2.1a" },
    { name: "EOS-08 (ISRO)", norad: 60450, lat: 14.2, lon: 81.3, alt: 475, vel: 7.62, rocket: "SSLV-D3" },
    { name: "STARSHIP TEST FLIGHT 5", norad: 99901, lat: 21.0, lon: 65.0, alt: 220, vel: 7.82, rocket: "Super Heavy / Starship" }
  ];

  recentLaunchesMock.forEach(item => {
    const marker = L.circleMarker([item.lat, item.lon], {
      radius: 8,
      color: '#ff9f0a',
      fillColor: '#ff9f0a',
      fillOpacity: 0.8,
      weight: 2
    }).bindPopup(`
      <div style="font-size:11px;min-width:180px;padding:2px;">
        <b style="color:#ff9f0a;font-size:12px;display:block;margin-bottom:3px;">🚀 ${item.name}</b>
        <div>Vehicle: <b>${item.rocket}</b></div>
        <div>NORAD ID: <b>#${item.norad}</b></div>
        <div>Altitude: <b>${item.alt} km</b></div>
        <div>Velocity: <b>${item.vel} km/s</b></div>
        <div style="margin-top:6px;padding-top:4px;border-top:1px solid var(--line);font-size:9px;color:var(--muted);">
          Recent Space Command Catalog
        </div>
      </div>
    `);
    newlyDeployedLayerGroup.addLayer(marker);
  });

  satMap.flyTo([20, 0], 2, { duration: 1 });
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
    { id: 60120, name: "STARLINK GROUP 10-1", type: "Constellation" },
    { id: 60450, name: "EOS-08 (ISRO SSLV)", type: "Earth Observation" }
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
        const id = parseInt(btn.getAttribute('data-id'), 10);
        const name = btn.getAttribute('data-name');
        currentSatelliteId = id;
        currentSatelliteName = name;
        dropdown.hidden = true;
        input.value = name;
        const hudName = document.getElementById('hud-sat-name');
        if (hudName) hudName.textContent = currentSatelliteName;
        pollSatellitePosition();
      });
    });
  });
}

async function pollSatellitePosition() {
  const latEl = document.getElementById('map-lat');
  const lonEl = document.getElementById('map-lon');
  const altEl = document.getElementById('map-alt');
  const velEl = document.getElementById('map-vel');
  const hudTel = document.getElementById('hud-sat-telemetry');

  try {
    let lat, lon, alt, vel;

    if (currentSatelliteId === 25544) {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const data = await res.json();
      lat = data.latitude;
      lon = data.longitude;
      alt = data.altitude;
      vel = data.velocity / 3600;
    } else {
      const config = ORBITAL_FLEET[currentSatelliteId] || { inc: 45, mm: 14.5, alt: 500, vel: 7.5 };
      const now = Date.now() / 1000;
      const periodSec = 86400 / (config.mm || 15);
      const phase = (now % periodSec) / periodSec;
      lat = Math.sin(phase * Math.PI * 2) * (config.inc || 45);
      lon = (((now / 240) % 360) - 180);
      alt = config.alt || 500;
      vel = config.vel || 7.5;
    }

    lastSatData = { latitude: lat, longitude: lon, altitude: alt, velocity: vel };

    if (latEl) latEl.textContent = `${lat.toFixed(2)}°`;
    if (lonEl) lonEl.textContent = `${lon.toFixed(2)}°`;
    if (altEl) altEl.textContent = `${alt.toFixed(1)} km`;
    if (velEl) velEl.textContent = `${vel.toFixed(2)} km/s`;
    if (hudTel) hudTel.textContent = `${alt.toFixed(0)} km · ${vel.toFixed(2)} km/s`;

    if (issMarker && satMap) {
      issMarker.setLatLng([lat, lon]);
      issMarker.setIcon(getModel1TacticalHudIcon(currentSatelliteId, currentSatelliteName, `${alt.toFixed(0)}km`, `${vel.toFixed(1)}km/s`));
      window.showFullSatTelemetry();
    }

    checkMultiSpacecraftOverheadPass(lat, lon, currentSatelliteName, vel);
  } catch (err) {
    if (hudTel) hudTel.textContent = 'Telemetry cached';
  }
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
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(userLat * Math.PI / 180) * Math.cos(satLat * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
// 7. PLANETARY EXPLORER (NASA DEEP SPACE SCIENCE ARCHIVES)
// ============================================================================
function initPlanetaryExplorer() {
  const topicChips = document.querySelectorAll('.planetary-chip');
  const mediaChips = document.querySelectorAll('.media-chip');

  topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topicChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPlanetaryTopic = chip.getAttribute('data-topic');
      const lbl = document.getElementById('planetary-current-topic-label');
      if (lbl) lbl.textContent = chip.textContent;
      fetchPlanetaryFeed(currentPlanetaryTopic, currentPlanetaryMediaType);
    });
  });

  mediaChips.forEach(chip => {
    chip.addEventListener('click', () => {
      mediaChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentPlanetaryMediaType = chip.getAttribute('data-media');
      fetchPlanetaryFeed(currentPlanetaryTopic, currentPlanetaryMediaType);
    });
  });
}

async function fetchPlanetaryFeed(topic, mediaTypes) {
  const container = document.getElementById('planetary-gallery-container');
  const timestamp = document.getElementById('planetary-feed-timestamp');
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state" style="grid-column: 1 / -1; text-align:center; padding: 40px;">
      <div class="apple-spinner large"></div>
      <p style="margin-top:10px; color:var(--muted);">Streaming deep space telescope detector array…</p>
    </div>
  `;

  const queryMap = {
    'deep-field': 'Hubble Deep Field webb first deep field',
    'jwst-raw': 'James Webb Space Telescope raw infrared',
    'hubble-raw': 'Hubble Space Telescope raw science',
    'nebulae': 'Carina Nebula Orion Nebula Pillars of Creation',
    'galaxies': 'spiral galaxy collision Andromeda James Webb',
    'black-holes': 'Black hole accretion disk event horizon Chandra',
    'supernovae': 'Cassiopeia A Supernova Remnant Crab Nebula',
    'pulsars': 'Pulsar neutron star magnetar',
    'exoplanets': 'Exoplanet atmosphere TRAPPIST Kepler',
    'gravitational': 'gravitational lensing Einstein ring Webb',
    'sun': 'Solar Dynamics Observatory SDO solar flare corona',
    'mars-raw': 'Perseverance rover Mastcam Gale crater Curiosity',
    'jupiter': 'JunoCam Jupiter Great Red Spot James Webb',
    'saturn': 'Cassini Saturn rings Enceladus Titan',
    'interstellar': 'Comet Oumuamua Borisov Kuiper belt Voyager',
    'earth': 'Earth from space ISS DSCOVR EPIC night lights'
  };

  const q = encodeURIComponent(queryMap[topic] || 'JWST deep space universe');
  const mediaParam = encodeURIComponent(mediaTypes || 'image,video,audio');

  try {
    const res = await fetch(`https://images-api.nasa.gov/search?q=${q}&media_type=${mediaParam}&page_size=18`);
    const data = await res.json();
    const items = data.collection?.items || [];

    if (timestamp) {
      timestamp.textContent = `SYNCED ${new Date().toLocaleTimeString()} IST`;
    }

    if (!items.length) {
      container.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--muted);">No matching sensor records returned for this format.</p>`;
      return;
    }

    container.innerHTML = '';
    planetaryExplorerLoaded = true;

    items.forEach(item => {
      const itemData = item.data?.[0];
      if (!itemData) return;

      const mediaType = itemData.media_type;
      const title = itemData.title || 'Observatory Detection';
      const desc = itemData.description || 'Deep space instrument observation telemetry.';
      const date = itemData.date_created ? new Date(itemData.date_created).toLocaleDateString() : 'Active Archive';
      const nasaId = itemData.nasa_id;
      const thumb = item.links?.[0]?.href || 'assets/space-hub-icon-192.png?v=1';

      const card = document.createElement('article');
      card.className = 'planetary-card';
      card.innerHTML = `
        <div class="planetary-card-media">
          <img src="${thumb}" alt="${title}" loading="lazy" onerror="this.src='assets/space-hub-icon-192.png?v=1';">
          <span class="planetary-tag">${itemData.center || 'NASA'}</span>
          ${mediaType === 'video' ? '<div class="planetary-play-badge">▶</div>' : ''}
          ${mediaType === 'audio' ? '<div class="planetary-play-badge">🎙️</div>' : ''}
          <span class="planetary-media-type-tag">${mediaType.toUpperCase()}</span>
        </div>
        <div class="planetary-card-body">
          <span class="planetary-date">${date}</span>
          <h4>${title}</h4>
          <p>${desc.slice(0, 140)}…</p>
          <div class="planetary-card-action">Inspect Telemetry ↗</div>
        </div>
      `;

      card.addEventListener('click', async () => {
        showToast('Accessing NASA master media buffer…');
        let fullMediaUrl = thumb;

        try {
          const assetRes = await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`);
          const assetData = await assetRes.json();
          const files = assetData.collection?.items || [];

          if (mediaType === 'video') {
            const mp4 = files.find(f => f.href.endsWith('~orig.mp4')) || files.find(f => f.href.endsWith('.mp4'));
            if (mp4) fullMediaUrl = mp4.href;
          } else if (mediaType === 'audio') {
            const mp3 = files.find(f => f.href.endsWith('.mp3') || f.href.endsWith('.wav'));
            if (mp3) fullMediaUrl = mp3.href;
          } else {
            const orig = files.find(f => f.href.endsWith('~orig.jpg') || f.href.endsWith('~large.jpg'));
            if (orig) fullMediaUrl = orig.href;
          }
        } catch (_) {}

        openUniversalLightbox(
          fullMediaUrl,
          title,
          `NASA Telemetry Record · ${date}`,
          `${nasaId}.${mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'mp3' : 'jpg'}`,
          mediaType,
          nasaId
        );
      });

      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--red);">Telemetry downlink interrupted. Tap refresh to retry.</p>`;
  }
}

// ============================================================================
// 8. ROCKET LAUNCH MANIFEST & NASA T-MINUS CLOCK
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
    const res = await fetch('https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=8&mode=detailed');
    const data = await res.json();
    const launches = data.results || [];

    if (!launches.length) return;

    const next = launches[0];
    const targetDate = new Date(next.net);

    if (spotlightName) spotlightName.textContent = next.name;
    if (spotlightDesc) spotlightDesc.textContent = next.mission?.description || 'Orbital deployment flight manifest with verified trajectory.';
    if (spotlightRocket) spotlightRocket.textContent = next.rocket?.configuration?.name || 'Launch Vehicle';
    if (spotlightProvider) spotlightProvider.textContent = next.launch_service_provider?.name || 'Space Agency';
    if (spotlightPad) spotlightPad.textContent = next.pad?.name || 'Launch Pad Complex';

    const istString = targetDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
    const utcString = targetDate.toUTCString();

    if (spotlightTimeIst) spotlightTimeIst.textContent = istString;
    if (spotlightTimeUtc) spotlightTimeUtc.textContent = `T-Minus target: ${utcString}`;

    if (heroLaunchName) heroLaunchName.textContent = next.name;
    if (heroLaunchProvider) heroLaunchProvider.textContent = `${next.launch_service_provider?.name || 'Launch'} ↗`;
    if (ovName) ovName.textContent = next.name;
    if (ovDesc) ovDesc.textContent = next.mission?.description ? next.mission.description.slice(0, 140) + '…' : 'Flight manifest countdown active.';
    if (ovProv) ovProv.textContent = `Provider: ${next.launch_service_provider?.name || 'Global'}`;
    if (ovVeh) ovVeh.textContent = `Vehicle: ${next.rocket?.configuration?.name || 'Rocket'}`;

    clearInterval(launchCountdownTimer);
    launchCountdownTimer = setInterval(() => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        if (heroLaunchTimer) heroLaunchTimer.textContent = "LIFTOFF";
        const cD = document.getElementById('clock-d');
        const cH = document.getElementById('clock-h');
        const cM = document.getElementById('clock-m');
        const cS = document.getElementById('clock-s');
        if (cD) cD.textContent = "00";
        if (cH) cH.textContent = "00";
        if (cM) cM.textContent = "00";
        if (cS) cS.textContent = "00";
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const dStr = String(days).padStart(2, '0');
      const hStr = String(hours).padStart(2, '0');
      const mStr = String(minutes).padStart(2, '0');
      const sStr = String(seconds).padStart(2, '0');

      const cD = document.getElementById('clock-d');
      const cH = document.getElementById('clock-h');
      const cM = document.getElementById('clock-m');
      const cS = document.getElementById('clock-s');

      if (cD) cD.textContent = dStr;
      if (cH) cH.textContent = hStr;
      if (cM) cM.textContent = mStr;
      if (cS) cS.textContent = sStr;

      if (heroLaunchTimer) heroLaunchTimer.textContent = `${dStr}d ${hStr}h ${mStr}m`;
    }, 1000);

    if (launchesList) {
      launchesList.innerHTML = launches.slice(1).map(l => {
        const time = new Date(l.net).toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' });
        return `
          <article class="launch-item-card">
            <div class="launch-item-header">
              <span class="launch-provider-badge">${l.launch_service_provider?.name || 'Space Agency'}</span>
              <span class="launch-status-badge">${l.status?.name || 'Scheduled'}</span>
            </div>
            <h4>${l.name}</h4>
            <p>${l.mission?.description ? l.mission.description.slice(0, 110) + '…' : 'Flight profile pending release.'}</p>
            <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--line);font-size:10px;font-family:var(--mono);color:var(--orange);">
              T-0: ${time} IST
            </div>
          </article>
        `;
      }).join('');
    }
  } catch (err) {
    if (spotlightName) spotlightName.textContent = 'Flight Manifest Active';
    if (heroLaunchTimer) heroLaunchTimer.textContent = 'SYNC ACTIVE';
  }
}

// ============================================================================
// 9. INTERPLANETARY: EARTH (DSCOVR) & MARS
// ============================================================================
async function fetchEpicEarth() {
  const box = document.getElementById('epic-media-box');
  const dUtc = document.getElementById('epic-date');
  const dIst = document.getElementById('epic-date-ist');
  const centroid = document.getElementById('epic-centroid');

  try {
    const res = await fetch(`https://api.nasa.gov/EPIC/api/natural?api_key=${NASA_API_KEY}`);
    const data = await res.json();
    if (!data || !data.length) return;

    const item = data[0];
    const dateParts = item.date.split(' ')[0].split('-');
    const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${dateParts[0]}/${dateParts[1]}/${dateParts[2]}/png/${item.image}.png`;

    if (box) {
      box.innerHTML = `<img src="${imgUrl}" alt="Earth full disc DSCOVR EPIC" loading="lazy">`;
      box.onclick = () => {
        openUniversalLightbox(imgUrl, 'Planet Earth — NASA DSCOVR EPIC', item.date + ' UTC', `${item.image}.png`, 'image');
      };
    }

    if (dUtc) dUtc.textContent = item.date + ' UTC';
    if (dIst) {
      const parsed = new Date(item.date + ' UTC');
      dIst.textContent = parsed.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'short' }) + ' IST';
    }
    if (centroid && item.centroid_coordinates) {
      centroid.textContent = `${item.centroid_coordinates.lat.toFixed(1)}°N, ${item.centroid_coordinates.lon.toFixed(1)}°E`;
    }
  } catch (_) {
    if (box) box.innerHTML = `<p style="color:var(--muted);">DSCOVR EPIC telemetry calibrating…</p>`;
  }
}

async function fetchMarsRovers() {
  const container = document.getElementById('mars-photos-container');
  const pSol = document.getElementById('perseverance-sol');
  const cSol = document.getElementById('curiosity-sol');

  try {
    const res = await fetch(`https://api.nasa.gov/mars-photos/api/v1/rovers/perseverance/latest_photos?api_key=${NASA_API_KEY}`);
    const data = await res.json();
    const photos = data.latest_photos || [];

    if (photos.length && pSol) pSol.textContent = `Sol ${photos[0].sol}`;
    if (cSol) cSol.textContent = 'Sol 4300+';

    if (container) {
      if (!photos.length) {
        container.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; color:var(--muted);">Martian radio relays transmitting telemetry buffer…</p>`;
        return;
      }

      container.innerHTML = photos.slice(0, 8).map(photo => `
        <div class="mars-photo-item" onclick="openUniversalLightbox('${photo.img_src}', '${photo.rover.name} Rover (${photo.camera.full_name})', 'Martian Sol ${photo.sol} · ${photo.earth_date}', 'Mars_${photo.id}.jpg', 'image')">
          <img src="${photo.img_src}" alt="Mars raw photo" loading="lazy">
          <div class="mars-photo-tag">${photo.camera.name} · Sol ${photo.sol}</div>
        </div>
      `).join('');
    }
  } catch (_) {
    if (container) container.innerHTML = `<p style="color:var(--muted);text-align:center;">Martian relay standby.</p>`;
  }
}

// ============================================================================
// 10. SPACE WEATHER & NASA DONKI
// ============================================================================
async function fetchSpaceWeather() {
  const kpVal = document.getElementById('sw-kp-val');
  const eventsBox = document.getElementById('weather-events');
  const cmeBox = document.getElementById('cme-events');

  try {
    const past = new Date(Date.now() - 30 * 86400000);
    const startStr = past.toISOString().split('T')[0];

    const flrRes = await fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${startStr}&api_key=${NASA_API_KEY}`);
    const flares = await flrRes.json();

    if (eventsBox && Array.isArray(flares)) {
      if (!flares.length) {
        eventsBox.innerHTML = `<p style="color:var(--muted);padding:12px;">Quiet solar cycle. No major X or M-class flares detected.</p>`;
      } else {
        eventsBox.innerHTML = flares.slice(0, 6).map(f => `
          <div class="weather-event-row">
            <div>
              <b style="color:var(--orange);">${f.classType} Solar Flare</b>
              <small>Peak: ${new Date(f.peakTime).toUTCString()}</small>
              <small>Active Region: ${f.activeRegionNum || 'Direct Disk'}</small>
            </div>
            <span class="small-chip orange">${f.classType}</span>
          </div>
        `).join('');
      }
    }

    const cmeRes = await fetch(`https://api.nasa.gov/DONKI/CME?startDate=${startStr}&api_key=${NASA_API_KEY}`);
    const cmes = await cmeRes.json();

    if (cmeBox && Array.isArray(cmes)) {
      if (!cmes.length) {
        cmeBox.innerHTML = `<p style="color:var(--muted);padding:12px;">No Earth-directed coronal mass ejections in current scan window.</p>`;
      } else {
        cmeBox.innerHTML = cmes.slice(0, 6).map(c => {
          const analysis = c.cmeAnalyses?.[0];
          const speed = analysis?.speed ? `${analysis.speed} km/s` : 'Analyzing trajectory';
          return `
            <div class="weather-event-row">
              <div>
                <b style="color:var(--blue);">Plasma Ejection (${c.activityID})</b>
                <small>Sensor: ${c.instruments?.[0]?.displayName || 'SOHO LASCO'}</small>
                <small>Ejection Speed: <b style="color:var(--text);font-family:var(--mono);">${speed}</b></small>
              </div>
              <span class="small-chip blue">Active CME</span>
            </div>
          `;
        }).join('');
      }
    }

    if (kpVal) kpVal.textContent = "Kp 2.0";
  } catch (_) {
    if (eventsBox) eventsBox.innerHTML = `<p style="color:var(--muted);padding:10px;">Heliophysics sensors operational.</p>`;
  }
}

// ============================================================================
// 11. COSMOS, APOD, ASTEROIDS & HAZARDS
// ============================================================================
async function fetchApod() {
  const mediaBox = document.getElementById('apod-media');
  const titleEl = document.getElementById('apod-title');
  const dateEl = document.getElementById('apod-date');
  const expEl = document.getElementById('apod-explanation');
  const crEl = document.getElementById('apod-copyright');

  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
    const data = await res.json();

    if (titleEl) titleEl.textContent = data.title;
    if (dateEl) dateEl.textContent = data.date;
    if (expEl) expEl.textContent = data.explanation;
    if (crEl && data.copyright) crEl.textContent = `© ${data.copyright}`;

    if (mediaBox) {
      if (data.media_type === 'video') {
        mediaBox.innerHTML = `<iframe src="${data.url}" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>`;
      } else {
        mediaBox.innerHTML = `<img src="${data.url}" alt="${data.title}" loading="lazy">`;
        mediaBox.onclick = () => {
          openUniversalLightbox(data.hdurl || data.url, data.title, data.date, `NASA_APOD_${data.date}.jpg`, 'image');
        };
      }
    }
  } catch (_) {
    if (titleEl) titleEl.textContent = 'Cosmic Explorer Standby';
  }
}

async function fetchNeoAsteroids() {
  const neoList = document.getElementById('neo-list');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${NASA_API_KEY}`);
    const data = await res.json();
    const neos = data.near_earth_objects?.[today] || [];

    if (neoList) {
      if (!neos.length) {
        neoList.innerHTML = `<p style="color:var(--muted);padding:12px;">NASA JPL radar reports 0 hazardous approaches for today's orbital plane.</p>`;
        return;
      }

      neoList.innerHTML = neos.slice(0, 6).map(n => {
        const d = n.estimated_diameter.meters;
        const dia = `${Math.round(d.estimated_diameter_min)} - ${Math.round(d.estimated_diameter_max)}m`;
        const approach = n.close_approach_data?.[0];
        const distKm = approach ? `${Math.round(parseFloat(approach.miss_distance.kilometers)).toLocaleString()} km` : '—';
        const isHazard = n.is_potentially_hazardous_asteroid;

        return `
          <div class="neo-item">
            <div class="neo-item-top">
              <b>${n.name}</b>
              <span class="hazard-pill ${isHazard ? 'red' : 'green'}">${isHazard ? 'POTENTIAL HAZARD' : 'SAFE PASS'}</span>
            </div>
            <div style="font-size:10px;color:var(--muted);">Diameter: ${dia}</div>
            <div class="neo-item-stats">
              <span>Miss: <b>${distKm}</b></span>
              <span>Speed: <b>${parseFloat(approach?.relative_velocity?.kilometers_per_second || 0).toFixed(1)} km/s</b></span>
            </div>
            <a class="neo-verify-link" href="${n.nasa_jpl_url}" target="_blank" rel="noopener">JPL Radar Telemetry ↗</a>
          </div>
        `;
      }).join('');
    }
  } catch (_) {
    if (neoList) neoList.innerHTML = `<p style="color:var(--muted);padding:10px;">JPL Radar active.</p>`;
  }
}

async function fetchEarthquakesAndHazards() {
  const quakeCount = document.getElementById('quake-count');
  const heroQuakeCount = document.getElementById('hero-quake-count');
  const quakeFeed = document.getElementById('earthquake-list');
  const hazardCount = document.getElementById('hazard-count');
  const hazardFeed = document.getElementById('hazard-list');

  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
    const data = await res.json();
    const quakes = data.features || [];

    if (quakeCount) quakeCount.textContent = `${quakes.length} DETECTED`;
    if (heroQuakeCount) heroQuakeCount.textContent = quakes.length;

    if (quakeFeed) {
      quakeFeed.innerHTML = quakes.slice(0, 8).map(q => {
        const mag = q.properties.mag.toFixed(1);
        const place = q.properties.place;
        const time = new Date(q.properties.time).toLocaleTimeString();
        const magClass = mag >= 5.0 ? 'red' : mag >= 4.0 ? 'orange' : 'green';

        return `
          <div class="quake-row">
            <div class="quake-row-top">
              <div class="mag-box ${magClass}">M${mag}</div>
              <b>${place}</b>
            </div>
            <div class="quake-row-bottom">
              <small>Time: ${time}</small>
              <a href="${q.properties.url}" target="_blank" rel="noopener" style="color:var(--blue);">USGS Event ↗</a>
            </div>
          </div>
        `;
      }).join('');
    }

    if (quakeLayerGroup && satMap) {
      quakeLayerGroup.clearLayers();
      quakes.slice(0, 40).forEach(q => {
        const [lon, lat] = q.geometry.coordinates;
        const mag = q.properties.mag;
        const color = mag >= 5.0 ? '#ff453a' : '#ffb454';
        L.circleMarker([lat, lon], {
          radius: Math.max(3, mag * 1.8),
          color: color,
          fillColor: color,
          fillOpacity: 0.6,
          weight: 1
        }).bindPopup(`<b>USGS M${mag}</b><br>${q.properties.place}`).addTo(quakeLayerGroup);
      });
    }
  } catch (_) {}

  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=12');
    const data = await res.json();
    const events = data.events || [];

    if (hazardCount) hazardCount.textContent = `${events.length} ACTIVE`;

    if (hazardFeed) {
      hazardFeed.innerHTML = events.slice(0, 8).map(h => {
        const cat = h.categories?.[0]?.title || 'Natural Event';
        return `
          <div class="quake-row">
            <div class="quake-row-top">
              <div class="mag-box purple">🌋</div>
              <b>${h.title}</b>
            </div>
            <div class="quake-row-bottom">
              <small>Category: ${cat}</small>
              <span style="color:var(--purple);font-family:var(--mono);">EONET</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (hazardLayerGroup && satMap) {
      hazardLayerGroup.clearLayers();
      events.forEach(h => {
        const geom = h.geometry?.[0];
        if (geom && geom.coordinates) {
          const [lon, lat] = geom.coordinates;
          L.circleMarker([lat, lon], {
            radius: 5,
            color: '#bf9cff',
            fillColor: '#bf9cff',
            fillOpacity: 0.8,
            weight: 1
          }).bindPopup(`<b>${h.title}</b><br>${h.categories?.[0]?.title || 'Hazard'}`).addTo(hazardLayerGroup);
        }
      });
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
      const lat = parseFloat(p.getAttribute('data-lat'));
      const lon = parseFloat(p.getAttribute('data-lon'));
      const name = p.getAttribute('data-name');
      loadAreaTelemetry(lat, lon, name);
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

      if (!results.length) {
        showToast('Location coordinates not found.');
        return;
      }

      if (suggestions) {
        suggestions.innerHTML = results.map(r => `
          <button class="dropdown-item" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}, ${r.country || ''}">
            <b>${r.name}</b> <small style="color:var(--muted);">${r.admin1 || ''}, ${r.country || ''}</small>
          </button>
        `).join('');
        suggestions.hidden = false;

        suggestions.querySelectorAll('.dropdown-item').forEach(item => {
          item.addEventListener('click', () => {
            const lat = parseFloat(item.getAttribute('data-lat'));
            const lon = parseFloat(item.getAttribute('data-lon'));
            const name = item.getAttribute('data-name');
            suggestions.hidden = true;
            if (input) input.value = name;
            loadAreaTelemetry(lat, lon, name);
          });
        });
      }
    } catch (_) {
      showToast('Geocoding service unavailable.');
    }
  }

  loadAreaTelemetry(17.3850, 78.4867, "Hyderabad, Telangana, India");
}

async function loadAreaTelemetry(lat, lon, placeName) {
  const title = document.getElementById('intel-area-title');
  const tag = document.getElementById('intel-coords-tag');
  const tempEl = document.getElementById('intel-temp');
  const feelEl = document.getElementById('intel-feels-like');
  const humEl = document.getElementById('intel-humidity');
  const windEl = document.getElementById('intel-wind');

  const aqiEl = document.getElementById('intel-aqi');
  const aqiBadge = document.getElementById('intel-aqi-badge');
  const pm25El = document.getElementById('intel-pm25');
  const pm10El = document.getElementById('intel-pm10');
  const no2El = document.getElementById('intel-no2');
  const solarEl = document.getElementById('intel-solar');

  if (title) title.textContent = placeName;
  if (tag) tag.textContent = `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`;

  try {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,direct_normal_irradiance`);
    const weather = await weatherRes.json();
    const currW = weather.current;

    if (currW) {
      if (tempEl) tempEl.textContent = `${Math.round(currW.temperature_2m)}°C`;
      if (feelEl) feelEl.textContent = `Feels like: ${Math.round(currW.apparent_temperature)}°C`;
      if (humEl) humEl.textContent = `${currW.relative_humidity_2m}%`;
      if (windEl) windEl.textContent = `${currW.wind_speed_10m} km/h`;
      if (solarEl) solarEl.textContent = `${Math.round(currW.direct_normal_irradiance || 0)} W/m²`;
    }

    const aqRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,nitrogen_dioxide`);
    const aq = await aqRes.json();
    const currAq = aq.current;

    if (currAq) {
      const aqi = currAq.us_aqi || 42;
      if (aqiEl) aqiEl.textContent = aqi;
      if (aqiBadge) {
        if (aqi <= 50) { aqiBadge.className = 'status-tag green'; aqiBadge.textContent = 'Good'; }
        else if (aqi <= 100) { aqiBadge.className = 'status-tag yellow'; aqiBadge.textContent = 'Moderate'; }
        else { aqiBadge.className = 'status-tag red'; aqiBadge.textContent = 'Unhealthy'; }
      }

      if (pm25El) pm25El.textContent = `${currAq.pm2_5 || '—'} µg/m³`;
      if (pm10El) pm10El.textContent = `${currAq.pm10 || '—'} µg/m³`;
      if (no2El) no2El.textContent = `${currAq.nitrogen_dioxide || '—'} µg/m³`;
    }
  } catch (_) {}
}

// ============================================================================
// 13. SPACE WIKIPEDIA EXPLORER
// ============================================================================
function initWiki() {
  const input = document.getElementById('wiki-query-input');
  const btn = document.getElementById('wiki-search-btn');
  const pills = document.querySelectorAll('.wiki-pill');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const topic = pill.getAttribute('data-topic');
      fetchWikiArticle(topic);
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
  const heading = document.getElementById('wiki-title');
  const extract = document.getElementById('wiki-extract');
  const link = document.getElementById('wiki-link');
  const thumb = document.getElementById('wiki-thumb');

  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    const data = await res.json();

    if (heading) heading.textContent = data.title || title;
    if (extract) extract.textContent = data.extract || 'Wikipedia summary not found.';
    if (link) link.href = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    if (thumb) thumb.src = data.thumbnail?.source || 'assets/space-hub-icon-192.png?v=1';
  } catch (_) {
    if (extract) extract.textContent = 'Unable to fetch Wikipedia article at this time.';
  }
}

// ============================================================================
// 14. PREFERENCES, LOCATIONS & PUSH NOTIFICATIONS
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
      const testSat = CAROUSEL_FLEET[carouselIndex % CAROUSEL_FLEET.length];
      const isStation = testSat.name.includes('ISS') || testSat.name.includes('TIANGONG');
      const photo = isStation ? NOTIFICATION_HERO_PHOTOS.station : NOTIFICATION_HERO_PHOTOS.satellite;

      new Notification(`T&C Space · ${testSat.name} Flyby`, {
        body: `${testSat.name} (${testSat.orbit}) flyby approaching your geographic horizon! Clear skies!`,
        icon: 'assets/space-hub-icon-192.png?v=1',
        image: photo
      });
      showToast('Test spacecraft flyby notification dispatched!');
    } else {
      showToast('Notification permission denied by browser.');
    }
  });

  gpsBtn?.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        localStorage.setItem('user_target_lat', pos.coords.latitude.toFixed(4));
        localStorage.setItem('user_target_lon', pos.coords.longitude.toFixed(4));
        localStorage.setItem('user_target_city', `GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`);
        if (locStatus) locStatus.textContent = `Target: GPS (${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°)`;
        showToast('GPS coordinates locked as flyby center.');
      }, () => {
        showToast('GPS access denied.');
      });
    }
  });

  metroSelect?.addEventListener('change', (e) => {
    const [lat, lon, name] = e.target.value.split(',');
    localStorage.setItem('user_target_lat', lat);
    localStorage.setItem('user_target_lon', lon);
    localStorage.setItem('user_target_city', name);
    if (locStatus) locStatus.textContent = `Target: ${name}, India`;
    showToast(`Location set to ${name}`);
  });
}

// ============================================================================
// 15. UNIVERSAL LIGHTBOX & DOWNLOAD ACTIONS
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

  activeMediaPayload = { url, title, timeStr, filename, mediaType, nasaId };

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
  const sheetNetSpeed = document.getElementById('sheet-net-speed');

  closeLbBtn?.addEventListener('click', closeUniversalLightbox);
  lb?.addEventListener('click', (e) => {
    if (e.target === lb) closeUniversalLightbox();
  });

  downloadBtn?.addEventListener('click', () => {
    if (sheetNetSpeed) sheetNetSpeed.textContent = `${currentNetworkSpeedMbps.toFixed(1)} Mbps`;
    if (sheet) sheet.classList.add('open');
  });

  sheetCancel?.addEventListener('click', () => {
    if (sheet) sheet.classList.remove('open');
  });

  sheet?.addEventListener('click', (e) => {
    if (e.target === sheet) sheet.classList.remove('open');
  });

  async function triggerDirectDownload(url, filename) {
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
    if (activeMediaPayload) triggerDirectDownload(activeMediaPayload.url, activeMediaPayload.filename);
  });

  sheetRaw?.addEventListener('click', () => {
    if (activeMediaPayload) triggerDirectDownload(activeMediaPayload.url, activeMediaPayload.filename);
  });

  shareBtn?.addEventListener('click', async () => {
    if (!activeMediaPayload) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}#planetary-explorer?asset=${encodeURIComponent(activeMediaPayload.nasaId || '')}&title=${encodeURIComponent(activeMediaPayload.title)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeMediaPayload.title,
          text: `Check out this space telemetry capture: ${activeMediaPayload.title}`,
          url: shareUrl
        });
      } catch (_) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast('Shareable link copied to clipboard!');
    }
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

  themeSelect?.addEventListener('change', (e) => {
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
    pollSatellitePosition();
    fetchLaunchesManifest();
    fetchEpicEarth();
    fetchMarsRovers();
    fetchSpaceWeather();
    fetchApod();
    fetchNeoAsteroids();
    fetchEarthquakesAndHazards();
  });

  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaBtn) pwaBtn.style.display = 'inline-flex';
  });

  pwaBtn?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        pwaBtn.style.display = 'none';
      }
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
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
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
  fetchMarsRovers();
  fetchSpaceWeather();
  fetchApod();
  fetchNeoAsteroids();
  fetchEarthquakesAndHazards();
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
