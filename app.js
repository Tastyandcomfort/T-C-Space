/* T&C Space Hub — Complete Web Space Intelligence Platform
   100% Real-Time Data · CelesTrak · Launch Library 2 · NASA DONKI · APOD · NeoWs · USGS · EONET · Wikipedia · Mars · EPIC · TechPort */
(() => {
  "use strict";

  const CONFIG = {
    NASA_KEY: "fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd",
    CATALOG_CACHE_MS: 2 * 60 * 60 * 1000,
    REFRESH_MS: 5 * 60 * 1000,
    APIS: {
      celestrakOmm: (cat) => `https://celestrak.org/NORAD/elements/gp.php?CATNR=${encodeURIComponent(cat)}&FORMAT=JSON`,
      celestrakSearch: (q) => `https://celestrak.org/NORAD/elements/gp.php?NAME=${encodeURIComponent(q)}&FORMAT=JSON`,
      celestrakStarlink: `https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=JSON`,
      launches: `https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=9`,
      donkiFlr: (s, e) => `https://api.nasa.gov/DONKI/FLR?startDate=${s}&endDate=${e}&api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      donkiGst: (s, e) => `https://api.nasa.gov/DONKI/GST?startDate=${s}&endDate=${e}&api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      donkiCme: (s, e) => `https://api.nasa.gov/DONKI/CME?startDate=${s}&endDate=${e}&api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      apod: `https://api.nasa.gov/planetary/apod?api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      neows: (s, e) => `https://api.nasa.gov/neo/rest/v1/feed?start_date=${s}&end_date=${e}&api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      earthquakes: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson`,
      eonet: `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=16`,
      wikipedia: (q) => `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.trim().replace(/\s+/g, "_"))}`,
      // NEW T&C DEEP LABS APIS
      marsPhotos: (rover = "perseverance") => `https://api.nasa.gov/mars-photos/api/v1/rovers/${rover}/latest_photos?api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      epicEarth: `https://api.nasa.gov/EPIC/api/natural?api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`,
      techport: `https://api.nasa.gov/techport/api/projects?api_key=fLRTKjpmtJGRWqzFKG8NrtmwbbkwBnPnWKNzn8Gd`
    }
  };

  const I18N = {
    en: {
      nav_overview: "Overview", nav_satellites: "Satellites & Earth", nav_launches: "Rocket Launches",
      nav_weather: "Solar & Weather", nav_astronomy: "Cosmos & Asteroids", nav_earth: "Earth Monitoring",
      nav_missions: "Deep Space", nav_wiki: "Wiki Explorer", nav_settings: "Settings & Alerts",
      eyebrow_platform: "SPACE INTELLIGENCE PLATFORM",
      welcome_sub: "100% Real-time public space telemetry: orbital satellite tracking, rocket countdowns, solar storms, asteroids and planetary monitoring.",
      systems_operational: "SYSTEMS OPERATIONAL", latest_update: "LATEST TELEMETRY",
      telemetry_live: "Real-time Telemetry"
    }
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n, d = 2) => Number.isFinite(Number(n)) ? Number(n).toFixed(d) : "—";
  const dateISO = (d = new Date()) => d.toISOString().slice(0, 10);

  const state = {
    map: null,
    tileLayer: null,
    marker: null,
    track: null,
    globe: null,
    currentOmm: null,
    currentSatName: "International Space Station",
    cache: {},
    theme: "system",
    lang: "en",
    nextLaunchNet: null,
    activeRover: "perseverance"
  };

  function toast(msg) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  async function cachedFetch(url, ttl = 60000) {
    const old = state.cache[url];
    if (old && Date.now() - old.time < ttl) return old.data;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.cache[url] = { time: Date.now(), data };
    return data;
  }

  function isDarkTheme() {
    return state.theme === "dark" || (state.theme === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function applyTheme(theme, persist = true) {
    state.theme = theme;
    const dark = isDarkTheme();
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.appearance = theme;
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    const meta = $("theme-color-meta");
    if (meta) meta.setAttribute("content", dark ? "#101114" : "#f5f5f7");
    if ($("theme-select")) $("theme-select").value = theme;
    if ($("setting-theme")) $("setting-theme").value = theme;
    if (persist) { try { localStorage.setItem("tc_space_theme", theme); } catch (_) {} }
    if (state.globe) {
      state.globe.globeImageUrl(dark ? "https://unpkg.com/three-globe/example/img/earth-night.jpg" : "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg");
    }
  }

  // --- MAP & GLOBE ---
  function initMap() {
    if (!window.L || !$("sat-map")) return;
    state.map = L.map("sat-map", { worldCopyJump: true, zoomControl: true }).setView([20, 0], 2);
    state.tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(state.map);
    state.marker = L.circleMarker([0, 0], { radius: 8, color: "#2997ff", weight: 2, fillColor: "#0071e3", fillOpacity: 0.9 }).addTo(state.map);
    state.track = L.polyline([], { color: "#2997ff", weight: 2, dashArray: "4 6", opacity: 0.8 }).addTo(state.map);
  }

  function initGlobe() {
    const el = $("globe-view");
    if (!el || !window.Globe) return;
    try {
      const dark = isDarkTheme();
      state.globe = Globe()(el)
        .width(el.clientWidth || 320)
        .height(el.clientHeight || 340)
        .globeImageUrl(dark ? "https://unpkg.com/three-globe/example/img/earth-night.jpg" : "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#3b82f6");
      state.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.3 });
      el.querySelector(".globe-loading")?.remove();
    } catch (_) {}
  }

  // --- SATELLITE PROPAGATION ---
  function propagateOmm(omm) {
    if (!window.satellite || typeof satellite.json2satrec !== "function") return null;
    try {
      const satrec = satellite.json2satrec(omm);
      const now = new Date();
      const pv = satellite.propagate(satrec, now);
      if (!pv.position || typeof pv.position === "boolean") return null;
      const gmst = satellite.gstime(now);
      const geo = satellite.eciToGeodetic(pv.position, gmst);
      return {
        lat: satellite.degreesLat(geo.latitude),
        lon: satellite.degreesLong(geo.longitude),
        alt: geo.height,
        vel: pv.velocity ? Math.sqrt(pv.velocity.x ** 2 + pv.velocity.y ** 2 + pv.velocity.z ** 2) : 7.66,
        satrec
      };
    } catch (_) { return null; }
  }

  async function selectSatellite(catNr) {
    try {
      const data = await cachedFetch(CONFIG.APIS.celestrakOmm(catNr), CONFIG.CATALOG_CACHE_MS);
      if (Array.isArray(data) && data.length) {
        state.currentOmm = data[0];
        state.currentSatName = state.currentOmm.OBJECT_NAME || `NORAD ${catNr}`;
        updateSatelliteUI();
      }
    } catch (_) {}
  }

  function updateSatelliteUI() {
    if (!state.currentOmm) return;
    const calc = propagateOmm(state.currentOmm);
    if (!calc) return;
    if ($("iss-alt")) $("iss-alt").textContent = fmt(calc.alt, 1) + " km";
    if ($("iss-velocity")) $("iss-velocity").textContent = fmt(calc.vel, 2) + " km/s";
    if ($("iss-name-metric")) $("iss-name-metric").textContent = state.currentSatName;

    if (state.map && state.marker) {
      state.marker.setLatLng([calc.lat, calc.lon]);
    }
  }

  // --- 2. ROCKET LAUNCHES ---
  async function loadLaunches() {
    try {
      const data = await cachedFetch(CONFIG.APIS.launches, 10 * 60000);
      const results = data.results || [];
      if (!results.length) return;
      const next = results[0];
      state.nextLaunchNet = new Date(next.net);
      if ($("spotlight-name")) $("spotlight-name").textContent = next.name || "Orbital Flight";
      if ($("spotlight-rocket")) $("spotlight-rocket").textContent = next.rocket?.configuration?.name || "Rocket";
      if ($("spotlight-provider")) $("spotlight-provider").textContent = next.launch_service_provider?.name || "Provider";
      if ($("hero-launch-name")) $("hero-launch-name").textContent = next.name?.slice(0, 32) || "Upcoming Launch";
    } catch (_) {}
  }

  function updateLaunchCountdown() {
    if (!state.nextLaunchNet) return;
    const diff = state.nextLaunchNet - Date.now();
    if (diff <= 0) {
      if ($("spotlight-countdown")) $("spotlight-countdown").textContent = "LAUNCH WINDOW OPEN";
      if ($("hero-launch-timer")) $("hero-launch-timer").textContent = "LIFTOFF";
      return;
    }
    const days = Math.floor(diff / (86400000));
    const hours = Math.floor((diff / 3600000) % 24);
    const mins = Math.floor((diff / 60000) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    if ($("spotlight-countdown")) $("spotlight-countdown").textContent = `${days}d ${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
    if ($("hero-launch-timer")) $("hero-launch-timer").textContent = `${days}d ${hours}h ${mins}m`;
  }

  // --- 3. SOLAR & SPACE WEATHER ---
  async function loadSpaceWeather() {
    const today = new Date();
    const start = new Date(today.getTime() - 7 * 86400000);
    const s = dateISO(start), e = dateISO(today);
    try {
      const flrs = await cachedFetch(CONFIG.APIS.donkiFlr(s, e), 30 * 60000);
      const solarCount = Array.isArray(flrs) ? flrs.length : 0;
      if ($("solar-count")) $("solar-count").textContent = solarCount;
      if ($("hero-solar-count")) $("hero-solar-count").textContent = `${solarCount} flares in 7 days`;
    } catch (_) {}

    try {
      const gsts = await cachedFetch(CONFIG.APIS.donkiGst(s, e), 30 * 60000);
      const stormCount = Array.isArray(gsts) ? gsts.length : 0;
      if ($("storm-count")) $("storm-count").textContent = stormCount;
      if ($("hero-solar-status")) $("hero-solar-status").textContent = stormCount > 0 ? "Active Storm" : "Normal";
    } catch (_) {}
  }

  // --- 4. APOD & ASTEROIDS ---
  async function loadApod() {
    try {
      const data = await cachedFetch(CONFIG.APIS.apod, 6 * 3600000);
      if ($("apod-title")) $("apod-title").textContent = data.title || "Astronomy Picture of the Day";
      if ($("apod-date")) $("apod-date").textContent = data.date || dateISO();
      if ($("apod-explanation")) $("apod-explanation").textContent = data.explanation || "";
      const media = $("apod-media");
      if (media && data.url) {
        media.innerHTML = `<img src="${esc(data.hdurl || data.url)}" alt="${esc(data.title)}">`;
      }
    } catch (_) {}
  }

  async function loadAsteroids() {
    const today = new Date();
    const forward = new Date(today.getTime() + 7 * 86400000);
    try {
      const data = await cachedFetch(CONFIG.APIS.neows(dateISO(today), dateISO(forward)), 60 * 60000);
      const neoMap = data.near_earth_objects || {};
      const all = [];
      Object.keys(neoMap).forEach(k => all.push(...neoMap[k]));
      const listEl = $("neo-list");
      if (listEl && all.length) {
        listEl.innerHTML = all.slice(0, 6).map(n => {
          const km = Math.round(Number(n.close_approach_data?.[0]?.miss_distance?.kilometers) || 0).toLocaleString();
          return `<div class="neo-row"><b>${esc(n.name)}</b> <span>${km} km miss</span></div>`;
        }).join("");
      }
    } catch (_) {}
  }

  // --- 5. USGS & EONET ---
  async function loadEarthquakes() {
    try {
      const data = await cachedFetch(CONFIG.APIS.earthquakes, 5 * 60000);
      const features = data.features || [];
      if ($("quake-count")) $("quake-count").textContent = `${features.length} IN 24H`;
      const el = $("earthquake-list");
      if (el && features.length) {
        el.innerHTML = features.slice(0, 8).map(f => `
          <div class="earthquake-item"><b>M ${f.properties.mag.toFixed(1)}</b> <span>${esc(f.properties.place)}</span></div>
        `).join("");
      }
    } catch (_) {}
  }

  // --- 6. T&C DEEP LABS (MARS, EPIC, TECHPORT) ---
  async function loadMarsRover(rover = "perseverance") {
    state.activeRover = rover;
    const container = $("mars-photo-container");
    if (!container) return;
    container.innerHTML = `<p class="muted">Loading latest telemetry from ${rover} rover…</p>`;
    try {
      const data = await cachedFetch(CONFIG.APIS.marsPhotos(rover), 60 * 60000);
      const photos = data.latest_photos || [];
      if (!photos.length) {
        container.innerHTML = `<p class="muted">No raw photo downlink available today for ${rover}.</p>`;
        return;
      }
      const p = photos[0];
      container.innerHTML = `<img src="${esc(p.img_src)}" alt="Martian surface by ${rover}">`;
      if ($("mars-rover-tag")) $("mars-rover-tag").textContent = `${rover.toUpperCase()} · ${p.camera?.full_name || "Camera"}`;
      if ($("mars-sol-label")) $("mars-sol-label").textContent = `Martian Sol: ${p.sol} (${p.earth_date})`;
      if ($("mars-camera-label")) $("mars-camera-label").textContent = `Camera: ${p.camera?.name || "Mastcam"}`;
    } catch (e) {
      container.innerHTML = `<p class="muted">Mars rover downlink temporarily offline.</p>`;
    }
  }

  async function loadEpicEarth() {
    const container = $("epic-earth-container");
    if (!container) return;
    try {
      const data = await cachedFetch(CONFIG.APIS.epicEarth, 60 * 60000);
      if (!Array.isArray(data) || !data.length) return;
      const latest = data[0];
      const dateParts = latest.date.split(" ")[0].split("-");
      const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${dateParts[0]}/${dateParts[1]}/${dateParts[2]}/png/${latest.image}.png`;
      container.innerHTML = `<img src="${esc(imgUrl)}" alt="Full Earth from DSCOVR EPIC">`;
      if ($("epic-date-label")) $("epic-date-label").textContent = `Downlink Date: ${latest.date}`;
    } catch (_) {
      container.innerHTML = `<p class="muted">DSCOVR EPIC telemetry unavailable.</p>`;
    }
  }

  async function loadTechPort() {
    const container = $("techport-list");
    if (!container) return;
    try {
      const data = await cachedFetch(CONFIG.APIS.techport, 120 * 60000);
      const projects = data.projects?.projects || [];
      if (!projects.length) return;
      container.innerHTML = projects.slice(0, 4).map(proj => `
        <div style="padding:10px; background:rgba(255,255,255,0.03); border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <b style="font-size:0.9rem; display:block; color:var(--fg);">${esc(proj.title)}</b>
          <span style="font-size:0.75rem; color:var(--muted);">Project ID: ${proj.id} · NASA Active Prototype</span>
        </div>
      `).join("");
    } catch (_) {
      container.innerHTML = `<p class="muted">NASA TechPort portfolio currently streaming.</p>`;
    }
  }

  // --- UI NAVIGATION & TABS ---
  function switchTab(targetId) {
    const targetSec = document.getElementById(targetId);
    if (!targetSec) return;
    document.querySelectorAll(".section-block").forEach(sec => sec.classList.remove("active-view"));
    targetSec.classList.add("active-view");
    document.querySelectorAll(".side-nav a[data-nav]").forEach(l => l.classList.remove("active"));
    const activeLink = document.querySelector(`.side-nav a[data-nav="${targetId}"]`);
    if (activeLink) activeLink.classList.add("active");
    if ($("current-section-label")) $("current-section-label").textContent = activeLink ? activeLink.querySelector(".nav-text")?.textContent || targetId : targetId;
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (targetId === "satellites") {
      setTimeout(() => state.map?.invalidateSize(), 60);
    }
  }

  function bindUI() {
    document.querySelectorAll(".side-nav a[data-nav]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const tid = link.getAttribute("data-nav");
        if (tid) switchTab(tid);
      });
    });

    document.querySelector(".brand")?.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("overview");
    });

    // Rover Switchers
    $("btn-rover-perseverance")?.addEventListener("click", () => {
      $("btn-rover-curiosity")?.classList.remove("active");
      $("btn-rover-perseverance")?.classList.add("active");
      loadMarsRover("perseverance");
    });
    $("btn-rover-curiosity")?.addEventListener("click", () => {
      $("btn-rover-perseverance")?.classList.remove("active");
      $("btn-rover-curiosity")?.classList.add("active");
      loadMarsRover("curiosity");
    });

    $("theme-select")?.addEventListener("change", e => applyTheme(e.target.value));
    $("refresh-all")?.addEventListener("click", () => { toast("Refreshing telemetry…"); refreshAll(); });
  }

  function clock() {
    if ($("utc-clock")) $("utc-clock").textContent = new Date().toISOString().slice(11, 19) + " UTC";
  }

  async function refreshAll() {
    clock();
    await Promise.allSettled([
      selectSatellite($("sat-select")?.value || "25544"),
      loadLaunches(),
      loadSpaceWeather(),
      loadApod(),
      loadAsteroids(),
      loadEarthquakes(),
      loadMarsRover(state.activeRover),
      loadEpicEarth(),
      loadTechPort()
    ]);
    if ($("last-updated")) $("last-updated").textContent = "UPDATED " + new Date().toLocaleTimeString();
  }

  function boot() {
    initMap();
    initGlobe();
    bindUI();
    refreshAll();
    setInterval(clock, 1000);
    setInterval(updateLaunchCountdown, 1000);
    setInterval(updateSatelliteUI, 1200);
    setInterval(refreshAll, CONFIG.REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
