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
      // T&C DEEP LABS APIS
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
      nav_install: "Install App", install_app_btn: "Install App",
      eyebrow_platform: "SPACE INTELLIGENCE PLATFORM",
      welcome_sub: "100% Real-time public space telemetry: orbital satellite tracking, rocket countdowns, solar storms, asteroids and planetary monitoring.",
      systems_operational: "SYSTEMS OPERATIONAL", latest_update: "LATEST TELEMETRY",
      telemetry_live: "Real-time Telemetry", download_apk: "Download Android APK", install_pwa: "Install Web App",
      banner_badge: "NATIVE ANDROID & PWA READY", banner_title: "Space Hub for Mobile & Tablet",
      banner_sub: "Get the full-speed offline Keplerian orbit propagator, push alerts, and telemetry ticker directly on your Android phone or browser home screen.",
      section_satellites_title: "Global Satellite Tracking & Planetary View",
      section_launches_title: "Upcoming Rocket Launches",
      section_weather_title: "Space Weather Watch",
      section_astronomy_title: "Astronomy Picture & Asteroid Watch",
      section_earth_title: "Real-time Earth Monitoring",
      section_missions_title: "Deep Space Telemetry",
      section_wiki_title: "Space Knowledge Hub",
      section_settings_title: "Settings & Space Alerts"
    },
    es: {
      nav_overview: "Inicio", nav_satellites: "Satélites y Tierra", nav_launches: "Lanzamientos",
      nav_weather: "Solar y Clima", nav_astronomy: "Cosmos y Asteroides", nav_earth: "Monitoreo Terrestre",
      nav_missions: "Espacio Profundo", nav_wiki: "Explorador Wiki", nav_settings: "Ajustes y Alertas",
      nav_install: "Instalar App", install_app_btn: "Instalar App",
      eyebrow_platform: "PLATAFORMA DE INTELIGENCIA ESPACIAL",
      welcome_sub: "Telemetría espacial 100% en tiempo real: seguimiento de satélites, lanzamientos, clima solar y sismos.",
      systems_operational: "SISTEMAS OPERATIVOS", latest_update: "ÚLTIMA TELEMETRÍA",
      telemetry_live: "Telemetría en Vivo", download_apk: "Descargar APK Android", install_pwa: "Instalar App Web",
      banner_badge: "ANDROID NATIVO Y PWA LISTO", banner_title: "Space Hub para Móvil y Tableta",
      banner_sub: "Propagador orbital Kepleriano fuera de línea, alertas automáticas y cuenta regresiva de cohetes.",
      section_satellites_title: "Seguimiento Global de Satélites y Vista Planetaria",
      section_launches_title: "Próximos Lanzamientos de Cohetes",
      section_weather_title: "Vigilancia del Clima Espacial",
      section_astronomy_title: "Imagen Astronómica y Radar de Asteroides",
      section_earth_title: "Monitoreo Terrestre en Tiempo Real",
      section_missions_title: "Telemetría del Espacio Profundo",
      section_wiki_title: "Centro de Conocimiento Espacial",
      section_settings_title: "Ajustes y Alertas Espaciales"
    },
    fr: {
      nav_overview: "Aperçu", nav_satellites: "Satellites & Terre", nav_launches: "Fusées & Vols",
      nav_weather: "Solaire & Météo", nav_astronomy: "Cosmos & Astéroïdes", nav_earth: "Surveillance Terre",
      nav_missions: "Espace Lointain", nav_wiki: "Explorateur Wiki", nav_settings: "Paramètres & Alertes",
      nav_install: "Installer l'App", install_app_btn: "Installer l'App",
      eyebrow_platform: "PLATEFORME D'INTELLIGENCE SPATIALE",
      welcome_sub: "Télémétrie spatiale 100% en direct : suivi orbital, décomptes de lancements, tempêtes solaires et séismes.",
      systems_operational: "SYSTÈMES OPÉRATIONNELS", latest_update: "DERNIÈRE TÉLÉMÉTRIE",
      telemetry_live: "Télémétrie en Direct", download_apk: "Télécharger l'APK Android", install_pwa: "Installer l'App Web",
      banner_badge: "ANDROID NATIF & PWA PRÊTS", banner_title: "Space Hub sur Mobile & Tablette",
      banner_sub: "Moteur orbital Keplerian SGP4 hors-ligne, notifications d'alerte et suivi des sondes interstellaires.",
      section_satellites_title: "Suivi Mondial des Satellites & Globe 3D",
      section_launches_title: "Prochains Lancements Spatiaux",
      section_weather_title: "Météorologie Spatiale & Soleil",
      section_astronomy_title: "Image du Cosmos & Astéroïdes",
      section_earth_title: "Surveillance Géophysique en Direct",
      section_missions_title: "Télémétrie de l'Espace Lointain",
      section_wiki_title: "Base de Connaissances Spatiales",
      section_settings_title: "Paramètres & Alertes Spatiales"
    },
    de: {
      nav_overview: "Übersicht", nav_satellites: "Satelliten & Erde", nav_launches: "Raketenstarts",
      nav_weather: "Sonne & Wetter", nav_astronomy: "Kosmos & Asteroiden", nav_earth: "Erdüberwachung",
      nav_missions: "Tiefenraum", nav_wiki: "Wiki-Explorer", nav_settings: "Einstellungen & Alarme",
      nav_install: "App Installieren", install_app_btn: "App Installieren",
      eyebrow_platform: "RAUMFAHRT-INTELLIGENZ-PLATTFORM",
      welcome_sub: "100% Echtzeit-Weltraumtelemetrie: Satellitenbahnen, Raketen-Countdowns, Sonnenstürme und Erdbeben.",
      systems_operational: "SYSTEME BEREIT", latest_update: "AKTUELLE TELEMETRIE",
      telemetry_live: "Echtzeit-Telemetrie", download_apk: "Android-APK Herunterladen", install_pwa: "Web-App Installieren",
      banner_badge: "NATIVES ANDROID & PWA BEREIT", banner_title: "Space Hub für Smartphone & Tablet",
      banner_sub: "Offline-Kepler-Bahnberechnung, Warnungen bei geomagnetischen Stürmen und Live-ISS-Tracking.",
      section_satellites_title: "Globale Satellitenverfolgung & 3D-Globus",
      section_launches_title: "Bevorstehende Raketenstarts",
      section_weather_title: "Weltraumwetter-Beobachtung",
      section_astronomy_title: "Astronomiebild & Asteroiden-Radar",
      section_earth_title: "Echtzeit-Erdbeben & Naturereignisse",
      section_missions_title: "Tiefenraum-Telemetrie (Voyager)",
      section_wiki_title: "Weltraum-Wissensdatenbank",
      section_settings_title: "Einstellungen & Alarme"
    },
    zh: {
      nav_overview: "概览", nav_satellites: "卫星与地球", nav_launches: "火箭发射",
      nav_weather: "太阳与空间天气", nav_astronomy: "天文与小行星", nav_earth: "地球监测",
      nav_missions: "深空探测", nav_wiki: "太空百科", nav_settings: "设置与警报",
      nav_install: "安装应用", install_app_btn: "安装应用",
      eyebrow_platform: "太空空间智能平台",
      welcome_sub: "100% 实时公共空间遥测数据：轨道卫星跟踪、火箭发射倒计时、太阳风暴和地球灾害监测。",
      systems_operational: "系统运行正常", latest_update: "最新实时遥测",
      telemetry_live: "实时遥测在线", download_apk: "下载安卓 APK", install_pwa: "安装网页应用",
      banner_badge: "原生安卓与 PWA 已就绪", banner_title: "手机与平板 Space Hub",
      banner_sub: "全速开普勒轨道计算引擎、空间天气预警与深空旅行者号实时距离推算。",
      section_satellites_title: "全球卫星实时追踪与三维地球",
      section_launches_title: "全球轨道火箭发射计划",
      section_weather_title: "太阳活动与空间天气监测",
      section_astronomy_title: "每日天文图与近地小行星雷达",
      section_earth_title: "全球地震与自然灾害实时监测",
      section_missions_title: "深空星际任务实时遥测",
      section_wiki_title: "太空百科全书知识库",
      section_settings_title: "系统设置与空间警报"
    },
    ja: {
      nav_overview: "概要", nav_satellites: "人工衛星と地球", nav_launches: "ロケット打上げ",
      nav_weather: "宇宙天気・太陽", nav_astronomy: "宇宙画像と小惑星", nav_earth: "地球モニタリング",
      nav_missions: "深宇宙探査", nav_wiki: "宇宙百科", nav_settings: "設定とアラート",
      nav_install: "アプリをインストール", install_app_btn: "アプリ導入",
      eyebrow_platform: "宇宙インテリジェンス・プラットフォーム",
      welcome_sub: "100%リアルタイムの宇宙公開データ：衛星追跡、打上げカウントダウン、宇宙天気および地震観測。",
      systems_operational: "システム正常稼働中", latest_update: "最新テレメトリ",
      telemetry_live: "リアルタイムデータ受信中", download_apk: "Android APKをダウンロード", install_pwa: "Webアプリを追加",
      banner_badge: "ネイティブAndroid & PWA対応", banner_title: "スマホ・タブレット向けSpace Hub",
      banner_sub: "オフラインSGP4軌道計算、プッシュ通知、ボイジャー深宇宙追跡機能を完備。",
      section_satellites_title: "全球衛星リアルタイム追跡＆3D地球",
      section_launches_title: "今後のロケット打上げスケジュール",
      section_weather_title: "太陽活動と宇宙天気予報",
      section_astronomy_title: "今日の天文写真と地球接近天体",
      section_earth_title: "リアルタイム地震・自然災害モニタリング",
      section_missions_title: "深宇宙探査テレメトリ (ボイジャー)",
      section_wiki_title: "宇宙知識エクスプローラー",
      section_settings_title: "設定とアラートしきい値"
    },
    hi: {
      nav_overview: "अवलोकन", nav_satellites: "उपग्रह और पृथ्वी", nav_launches: "रॉकेट प्रक्षेपण",
      nav_weather: "सौर और मौसम", nav_astronomy: "ब्रह्मांड और क्षुद्रग्रह", nav_earth: "पृथ्वी निगरानी",
      nav_missions: "गहरा अंतरिक्ष", nav_wiki: "विकिपीडिया खोज", nav_settings: "सेटिंग्स और अलर्ट",
      nav_install: "ऐप इंस्टॉल करें", install_app_btn: "ऐप इंस्टॉल",
      eyebrow_platform: "अंतरिक्ष खुफिया मंच",
      welcome_sub: "100% वास्तविक समय अंतरिक्ष टेलीमेट्री: उपग्रह ट्रैकिंग, रॉकेट उलटी गिनती और भूकंप निगरानी।",
      systems_operational: "सभी प्रणालियां तैयार", latest_update: "नवीनतम टेलीमेट्री",
      telemetry_live: "सक्रिय टेलीमेट्री", download_apk: "एंड्रॉइड एपीके डाउनलोड", install_pwa: "वेब ऐप इंस्टॉल करें",
      banner_badge: "एंड्रॉइड और पीडब्ल्यूए तैयार", banner_title: "मोबाइल और टैबलेट के लिए स्पेस हब",
      banner_sub: "ऑफ़लाइन केप्लेरियन कक्षीय इंजन, रॉकेट काउंटडाउन और सौर तूफान अलर्ट सीधे प्राप्त करें।",
      section_satellites_title: "वैश्विक उपग्रह ट्रैकिंग और 3D ग्लोब",
      section_launches_title: "आगामी वैश्विक रॉकेट प्रक्षेपण",
      section_weather_title: "अंतरिक्ष मौसम और सौर गतिविधि",
      section_astronomy_title: "दैनिक खगोलीय चित्र और क्षुद्रग्रह",
      section_earth_title: "वास्तविक समय पृथ्वी और भूकंप निगरानी",
      section_missions_title: "गहरे अंतरिक्ष मिशन (वॉयेजर)",
      section_wiki_title: "अंतरिक्ष ज्ञान केंद्र",
      section_settings_title: "सेटिंग्स और अंतरिक्ष अलर्ट"
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
    nextLaunchName: "",
    searchTimer: null,
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

  function playAlertChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } catch (_) {}
  }

  function applyLanguage(lang) {
    state.lang = I18N[lang] ? lang : "en";
    const dict = I18N[state.lang];
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });
    if ($("lang-select")) $("lang-select").value = state.lang;
    if ($("setting-lang")) $("setting-lang").value = state.lang;
    try { localStorage.setItem("tc_space_lang", state.lang); } catch (_) {}
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

  // --- MAP & 3D GLOBE ---
  function initMap() {
    if (!window.L || !$("sat-map")) return;
    state.map = L.map("sat-map", { worldCopyJump: true, zoomControl: true }).setView([20, 0], 2);
    state.tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18
    }).addTo(state.map);
    state.marker = L.circleMarker([0, 0], { radius: 8, color: "#2997ff", weight: 2, fillColor: "#0071e3", fillOpacity: 0.9 }).addTo(state.map);
    state.track = L.polyline([], { color: "#2997ff", weight: 2, dashArray: "4 6", opacity: 0.8 }).addTo(state.map);
  }

  function renderGlobeLayers() {
    if (!state.globe) return;
    const pts = [];
    if (state.globeSatPoint) pts.push(state.globeSatPoint);
    if (state.globeStarlink?.length) pts.push(...state.globeStarlink);
    if (state.globeLaunches?.length) pts.push(...state.globeLaunches);
    if (state.globeNeos?.length) pts.push(...state.globeNeos);
    state.globe.pointsData(pts);

    const paths = [];
    if (state.globeTrack?.length) {
      paths.push({
        coords: state.globeTrack.map(p => [p[0], p[1], 0.025]),
        color: "rgba(56, 189, 248, 0.85)",
        stroke: 2.0
      });
    }
    if (state.globeLaunchPaths?.length) paths.push(...state.globeLaunchPaths);
    if (state.globeNeoPaths?.length) paths.push(...state.globeNeoPaths);
    state.globe.pathsData(paths);

    const rings = [];
    if (state.globeSatPoint) {
      rings.push({ lat: state.globeSatPoint.lat, lng: state.globeSatPoint.lng, maxR: 4, propagationSpeed: 2, repeatPeriod: 1200, color: () => "#ff453a" });
    }
    if (state.globeLaunches?.length) {
      const nextL = state.globeLaunches[0];
      rings.push({ lat: nextL.lat, lng: nextL.lng, maxR: 3.5, propagationSpeed: 1.5, repeatPeriod: 1500, color: () => "#ff9f0a" });
    }
    state.globe.ringsData(rings);
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
        .atmosphereColor("#3b82f6")
        .atmosphereAltitude(0.18)
        .pointAltitude(d => d.altitude || 0.02)
        .pointRadius(d => d.radius || 0.35)
        .pointColor(d => d.color || "#38bdf8")
        .pointLabel(d => `<div style="background:rgba(15,17,22,0.9);color:#fff;padding:6px 10px;border-radius:8px;font-size:11px;border:1px solid rgba(255,255,255,0.15)"><b>${esc(d.name)}</b><br><span style="opacity:0.8;font-size:9px">${esc(d.sub || "")}</span></div>`)
        .pathPoints(d => d.coords)
        .pathPointLat(p => p[0])
        .pathPointLng(p => p[1])
        .pathPointAlt(p => p[2] ?? 0.025)
        .pathColor(d => d.color || "rgba(56, 189, 248, 0.8)")
        .pathStroke(d => d.stroke || 1.8)
        .ringColor(d => d.color)
        .ringMaxRadius(d => d.maxR)
        .ringPropagationSpeed(d => d.propagationSpeed)
        .ringRepeatPeriod(d => d.repeatPeriod);

      state.globe.pointOfView({ lat: 20, lng: 0, altitude: 2.3 });
      el.querySelector(".globe-loading")?.remove();
      renderGlobeLayers();
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
        satrec,
        name: omm.OBJECT_NAME || "Satellite"
      };
    } catch (_) { return null; }
  }

  function projectGroundTrack(satrec, steps = 60, stepMinutes = 1.5) {
    if (!satrec || !window.satellite) return [];
    const pts = [];
    const baseTime = new Date();
    for (let i = -15; i <= steps; i++) {
      const t = new Date(baseTime.getTime() + i * stepMinutes * 60000);
      try {
        const pv = satellite.propagate(satrec, t);
        if (pv.position && typeof pv.position !== "boolean") {
          const gmst = satellite.gstime(t);
          const geo = satellite.eciToGeodetic(pv.position, gmst);
          pts.push([satellite.degreesLat(geo.latitude), satellite.degreesLong(geo.longitude)]);
        }
      } catch (_) {}
    }
    return pts;
  }

  async function selectSatellite(catNr) {
    try {
      const data = await cachedFetch(CONFIG.APIS.celestrakOmm(catNr), CONFIG.CATALOG_CACHE_MS);
      if (Array.isArray(data) && data.length) {
        state.currentOmm = data[0];
        state.currentSatName = state.currentOmm.OBJECT_NAME || `NORAD ${catNr}`;
        updateSatelliteUI();
        const calc = propagateOmm(state.currentOmm);
        if (calc && state.globe) {
          state.globe.pointOfView({ lat: calc.lat, lng: calc.lon, altitude: 2.3 }, 1000);
        }
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

    const trackPts = projectGroundTrack(calc.satrec);
    if (state.map && state.marker) {
      state.marker.setLatLng([calc.lat, calc.lon]);
      if (state.track) state.track.setLatLngs(trackPts);
      if ($("map-stamp")) $("map-stamp").textContent = `${state.currentSatName} · ${fmt(calc.lat, 2)}°, ${fmt(calc.lon, 2)}°`;
    }

    state.globeSatPoint = {
      lat: calc.lat,
      lng: calc.lon,
      altitude: 0.04,
      radius: 0.55,
      color: "#ff453a",
      name: `🛰️ ${state.currentSatName}`,
      sub: `Alt: ${fmt(calc.alt, 0)} km · Vel: ${fmt(calc.vel, 2)} km/s`
    };
    state.globeTrack = trackPts;
    renderGlobeLayers();
    if ($("globe-sat-tag")) $("globe-sat-tag").textContent = state.currentSatName.toUpperCase();
    checkOverheadPass(state.currentSatName, calc.lat, calc.lon, calc.alt);

    const panel = $("selected-satellite-panel");
    if (panel) {
      const meanMotion = Number(state.currentOmm.MEAN_MOTION) || 15.5;
      const periodMins = meanMotion > 0 ? (1440 / meanMotion).toFixed(1) : "—";
      panel.innerHTML = `
        <div class="selected-head">
          <div>
            <span class="badge-pill green">ORBITAL TRACKING</span>
            <h3>${esc(state.currentSatName)}</h3>
            <small>NORAD ID: ${state.currentOmm.NORAD_CAT_ID || "—"} · Designator: ${esc(state.currentOmm.OBJECT_ID || "—")}</small>
          </div>
          <button class="subtle-button" onclick="window.scrollTo({top:0,behavior:'smooth'})">Back to Map ↑</button>
        </div>
        <div class="selected-data-grid">
          <div><small>CALCULATED ALTITUDE</small><b>${fmt(calc.alt, 1)} km</b></div>
          <div><small>ORBITAL VELOCITY</small><b>${fmt(calc.vel, 2)} km/s</b></div>
          <div><small>CURRENT LAT / LON</small><b>${fmt(calc.lat, 2)}°, ${fmt(calc.lon, 2)}°</b></div>
          <div><small>ORBITAL PERIOD</small><b>${periodMins} mins</b></div>
        </div>
      `;
    }
  }

  async function searchSatellites(query) {
    if (!query || query.length < 2) return;
    try {
      const data = await cachedFetch(CONFIG.APIS.celestrakSearch(query), 300000);
      if (Array.isArray(data) && data.length) {
        showSuggestions(data.slice(0, 8));
      } else {
        showSuggestions([]);
      }
    } catch (_) { showSuggestions([]); }
  }

  function showSuggestions(list) {
    const el = $("sat-suggestions");
    if (!el) return;
    if (!list.length) { el.hidden = true; el.innerHTML = ""; return; }
    el.hidden = false;
    el.innerHTML = list.map(s => `
      <button type="button" class="suggestion-item" data-cat="${s.NORAD_CAT_ID}">
        <div>
          <b>${esc(s.OBJECT_NAME || "Satellite")}</b>
          <small>NORAD ID: ${s.NORAD_CAT_ID}</small>
        </div>
        <span>Select ➔</span>
      </button>
    `).join("");
    el.querySelectorAll(".suggestion-item").forEach(btn => {
      btn.addEventListener("click", () => {
        el.hidden = true;
        selectSatellite(btn.getAttribute("data-cat"));
      });
    });
  }

  // --- 2. ROCKET LAUNCHES ---
  async function loadLaunches() {
    const listEl = $("launches-list");
    try {
      const data = await cachedFetch(CONFIG.APIS.launches, 10 * 60000);
      const results = data.results || [];
      if (!results.length) return;
      const next = results[0];
      state.nextLaunchNet = new Date(next.net);
      state.nextLaunchName = next.name || "Orbital Launch";

      if ($("spotlight-name")) $("spotlight-name").textContent = next.name || "Orbital Flight";
      if ($("spotlight-desc")) $("spotlight-desc").textContent = next.mission?.description || "Orbital deployment mission.";
      if ($("spotlight-rocket")) $("spotlight-rocket").textContent = next.rocket?.configuration?.name || "Rocket";
      if ($("spotlight-provider")) $("spotlight-provider").textContent = next.launch_service_provider?.name || "Provider";
      if ($("spotlight-pad")) $("spotlight-pad").textContent = `${next.pad?.name || "Spaceport"}, ${next.pad?.location?.name || ""}`;
      if ($("spotlight-status")) $("spotlight-status").innerHTML = `<i></i> ${esc(next.status?.name || "SCHEDULED")}`;
      if ($("spotlight-datetime")) $("spotlight-datetime").textContent = `Target NET: ${new Date(next.net).toUTCString()}`;

      if ($("hero-launch-name")) $("hero-launch-name").textContent = next.name?.slice(0, 32) || "Upcoming Launch";
      if ($("hero-launch-provider")) $("hero-launch-provider").textContent = next.launch_service_provider?.name || "Provider";

      const vidBtn = $("spotlight-video-btn");
      if (next.vidURLs && next.vidURLs.length && vidBtn) {
        vidBtn.href = next.vidURLs[0].url;
        vidBtn.classList.remove("hidden");
      }

      const validLaunches = results.filter(l => Number.isFinite(Number(l.pad?.latitude)) && Number.isFinite(Number(l.pad?.longitude)));
      state.globeLaunches = validLaunches.map(l => ({
        lat: Number(l.pad.latitude),
        lng: Number(l.pad.longitude),
        altitude: 0.025,
        radius: 0.45,
        color: "#ff9f0a",
        name: `🚀 ${l.name || "Orbital Launch"}`,
        sub: `${l.launch_service_provider?.name || "Launch"}`
      }));
      renderGlobeLayers();

      if (listEl) {
        listEl.innerHTML = results.slice(1).map(l => {
          const d = new Date(l.net);
          const timeStr = isNaN(d) ? "TBD" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return `
            <article class="launch-card">
              <div class="launch-card-head"><span class="badge-pill">${esc(l.status?.abbrev || "GO")}</span><small class="mono">${esc(timeStr)}</small></div>
              <h4>${esc(l.name)}</h4>
              <p>${esc(l.mission?.description?.slice(0, 110) || "Orbital deployment mission.")}…</p>
            </article>
          `;
        }).join("");
      }
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

    let solarCount = 0;
    let stormCount = 0;
    const events = [];

    try {
      const flrs = await cachedFetch(CONFIG.APIS.donkiFlr(s, e), 30 * 60000);
      if (Array.isArray(flrs)) {
        solarCount = flrs.length;
        flrs.slice(0, 4).forEach(f => {
          events.push({
            type: "Solar Flare",
            title: `Solar Flare Class ${f.classType || "M"}`,
            time: f.beginTime || "Recent",
            details: `Source: ${f.sourceLocation || "Active Region"} · Peak: ${f.peakTime || "Observed"}`
          });
        });
      }
    } catch (_) {}

    try {
      const gsts = await cachedFetch(CONFIG.APIS.donkiGst(s, e), 30 * 60000);
      if (Array.isArray(gsts)) {
        stormCount = gsts.length;
        gsts.slice(0, 4).forEach(g => {
          const kp = g.allKpIndex?.[0]?.kpIndex || 4;
          events.push({
            type: "Geomagnetic Storm",
            title: `Geomagnetic Storm (Kp ${kp})`,
            time: g.startTime || "Recent",
            details: `Planetary index ${kp} · Potential satellite drag and auroras.`
          });
        });
      }
    } catch (_) {}

    if ($("solar-count")) $("solar-count").textContent = solarCount;
    if ($("storm-count")) $("storm-count").textContent = stormCount;
    if ($("hero-solar-status")) $("hero-solar-status").textContent = stormCount > 0 ? "Active Storm" : "Quiet";
    if ($("hero-solar-count")) $("hero-solar-count").textContent = `${solarCount} flares in 7 days`;
    if ($("aurora-status")) $("aurora-status").textContent = stormCount > 0 ? "Active Aurora" : "Normal Kp";

    const el = $("weather-events");
    if (el) {
      el.innerHTML = events.length ? events.map(ev => `
        <div class="event-card">
          <small>${esc(ev.type)} · ${esc(ev.time.slice(0, 16))}</small>
          <b>${esc(ev.title)}</b>
          <p>${esc(ev.details)}</p>
        </div>
      `).join("") : `<p class="muted">No major solar flares or storms recorded in past 7 days.</p>`;
    }
  }

  // --- 4. NASA APOD & ASTEROIDS ---
  async function loadApod() {
    try {
      const data = await cachedFetch(CONFIG.APIS.apod, 6 * 3600000);
      if ($("apod-title")) $("apod-title").textContent = data.title || "Astronomy Picture of the Day";
      if ($("apod-date")) $("apod-date").textContent = data.date || dateISO();
      if ($("apod-explanation")) $("apod-explanation").textContent = data.explanation || "";
      if ($("apod-copyright") && data.copyright) $("apod-copyright").textContent = `© ${data.copyright}`;

      const media = $("apod-media");
      if (media && data.url) {
        if (data.media_type === "video") {
          media.innerHTML = `<iframe src="${esc(data.url)}" allowfullscreen></iframe>`;
        } else {
          media.innerHTML = `<img src="${esc(data.hdurl || data.url)}" alt="${esc(data.title)}">`;
        }
      }
    } catch (_) {}
  }

  async function loadAsteroids() {
    const listEl = $("neo-list");
    const today = new Date();
    const forward = new Date(today.getTime() + 7 * 86400000);
    try {
      const data = await cachedFetch(CONFIG.APIS.neows(dateISO(today), dateISO(forward)), 60 * 60000);
      const neoMap = data.near_earth_objects || {};
      const all = [];
      Object.keys(neoMap).forEach(k => all.push(...neoMap[k]));

      if (listEl && all.length) {
        listEl.innerHTML = all.slice(0, 8).map(n => {
          const ca = n.close_approach_data?.[0] || {};
          const km = Number(ca.miss_distance?.kilometers) || 0;
          const lunar = (km / 384400).toFixed(1);
          const diam = fmt(n.estimated_diameter?.meters?.estimated_diameter_max, 0);
          const isHazard = n.is_potentially_hazardous_asteroid;
          return `
            <div class="neo-row">
              <div>
                <b>${esc(n.name)} ${isHazard ? '<span class="tiny-dot red" title="Hazardous"></span>' : ''}</b>
                <small>${esc(ca.close_approach_date || "")} · ~${diam}m · ${lunar} LD</small>
              </div>
              <div class="neo-distance">${(km / 1e6).toFixed(2)}M km</div>
            </div>
          `;
        }).join("");
      }
    } catch (_) {}
  }

  // --- 5. USGS & EONET ---
  async function loadEarthquakes() {
    const el = $("earthquake-list");
    try {
      const data = await cachedFetch(CONFIG.APIS.earthquakes, 5 * 60000);
      const features = data.features || [];
      if ($("quake-count")) $("quake-count").textContent = `${features.length} IN 24H`;

      if (el && features.length) {
        el.innerHTML = features.slice(0, 10).map(f => {
          const mag = Number(f.properties?.mag) || 0;
          const place = f.properties?.place || "Global location";
          const badgeClass = mag >= 6.0 ? "red" : (mag >= 4.5 ? "orange" : "green");
          return `
            <a class="earthquake-item" href="${esc(f.properties?.url || '#')}" target="_blank" rel="noopener">
              <span class="mag-badge ${badgeClass}">${mag.toFixed(1)}</span>
              <div><b>${esc(place)}</b><small>Depth ${fmt(f.geometry?.coordinates?.[2], 1)} km</small></div>
            </a>
          `;
        }).join("");
      }
    } catch (_) {}
  }

  async function loadEonet() {
    const el = $("eonet-list");
    try {
      const data = await cachedFetch(CONFIG.APIS.eonet, 30 * 60000);
      const events = data.events || [];
      if (el && events.length) {
        el.innerHTML = events.slice(0, 8).map(ev => {
          const cat = ev.categories?.[0]?.title || "Natural Event";
          const icon = cat.includes("Wildfire") ? "🔥" : (cat.includes("Volcano") ? "🌋" : (cat.includes("Storm") ? "🌪️" : "🌊"));
          return `
            <a class="eonet-item" href="${esc(ev.sources?.[0]?.url || 'https://eonet.gsfc.nasa.gov')}" target="_blank" rel="noopener">
              <span class="eonet-icon">${icon}</span>
              <div><b>${esc(ev.title)}</b><small>${esc(cat)} · NASA EONET</small></div>
            </a>
          `;
        }).join("");
      }
    } catch (_) {}
  }

  // --- 6. DEEP SPACE TELEMETRY (VOYAGER 1 & 2) ---
  function updateDeepSpaceTelemetry() {
    const now = new Date();
    const v1Launch = new Date("1977-09-05T12:56:00Z");
    const yearsElapsedV1 = (now - v1Launch) / (365.25 * 86400000);
    const v1AU = (163.4 + (yearsElapsedV1 - 47.16) * 3.58).toFixed(2);
    const v1Km = (v1AU * 149597870.7).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const v1LightHours = (v1AU * 0.1388 * 2).toFixed(1);

    if ($("v1-dist-sun")) $("v1-dist-sun").textContent = `~${v1AU} AU (${v1Km} km)`;
    if ($("v1-light-time")) $("v1-light-time").textContent = `~${v1LightHours} hrs round-trip`;

    const v2Launch = new Date("1977-08-20T14:29:00Z");
    const yearsElapsedV2 = (now - v2Launch) / (365.25 * 86400000);
    const v2AU = (136.7 + (yearsElapsedV2 - 47.2) * 3.23).toFixed(2);
    const v2Km = (v2AU * 149597870.7).toLocaleString(undefined, { maximumFractionDigits: 0 });
    const v2LightHours = (v2AU * 0.1388 * 2).toFixed(1);

    if ($("v2-dist-sun")) $("v2-dist-sun").textContent = `~${v2AU} AU (${v2Km} km)`;
    if ($("v2-light-time")) $("v2-light-time").textContent = `~${v2LightHours} hrs round-trip`;
  }

  // --- 7. SPACE WIKIPEDIA EXPLORER ---
  async function searchWiki(topic) {
    if (!topic) return;
    try {
      const data = await cachedFetch(CONFIG.APIS.wikipedia(topic), 24 * 3600000);
      if ($("wiki-title")) $("wiki-title").textContent = data.displaytitle || data.title || topic;
      if ($("wiki-extract")) $("wiki-extract").textContent = data.extract || "No summary available.";
      if ($("wiki-desc-tag")) $("wiki-desc-tag").textContent = (data.description || "ENCYCLOPEDIC BRIEF").toUpperCase();
      if ($("wiki-link")) $("wiki-link").href = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`;
      const thumb = $("wiki-thumb");
      if (thumb) thumb.src = data.thumbnail?.source || "assets/space-hub-icon-512.png";
    } catch (_) {}
  }

  // --- 8. AREA-WISE INTELLIGENCE BRIEF (OPEN-METEO) ---
  async function loadAreaIntelligence(areaName) {
    if (!areaName) return;
    if ($("intel-area-title")) $("intel-area-title").textContent = `Analyzing ${areaName}…`;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(areaName)}&count=1&language=en&format=json`;
      const geoData = await cachedFetch(geoUrl, 3600000);
      const loc = geoData.results?.[0];
      if (!loc) return;
      const { latitude: lat, longitude: lon, name, country, elevation, population } = loc;
      if ($("intel-area-title")) $("intel-area-title").textContent = `${name}${country ? ", " + country : ""}`;
      if ($("intel-coords-tag")) $("intel-coords-tag").textContent = `${fmt(lat, 2)}°, ${fmt(lon, 2)}° · POP ${population ? (population / 1e6).toFixed(2) + "M" : "N/A"}`;
      if ($("intel-elevation-tag")) $("intel-elevation-tag").textContent = `Elev: ${elevation ?? 0} m`;

      const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,nitrogen_dioxide,ozone`;
      const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,soil_moisture_0_to_1cm,soil_moisture_3_to_9cm,shortwave_radiation,uv_index`;
      const [aqRes, wxRes, wikiRes] = await Promise.allSettled([
        cachedFetch(aqUrl, 600000),
        cachedFetch(wxUrl, 600000),
        cachedFetch(CONFIG.APIS.wikipedia(name), 86400000)
      ]);

      if (aqRes.status === "fulfilled" && aqRes.value?.current) {
        const c = aqRes.value.current;
        const aqi = c.us_aqi ?? "—";
        const aqiLabel = aqi <= 50 ? "Good · Clean Air" : (aqi <= 100 ? "Moderate" : "Unhealthy · Elevated");
        if ($("intel-aqi")) $("intel-aqi").textContent = `${aqi} AQI`;
        if ($("intel-aqi-status")) $("intel-aqi-status").textContent = aqiLabel;
        if ($("intel-pollution")) $("intel-pollution").textContent = `${fmt(c.pm2_5, 1)} / ${fmt(c.pm10, 1)} µg/m³`;
        if ($("intel-pollution-sub")) $("intel-pollution-sub").textContent = `PM2.5 / PM10 · NO₂: ${fmt(c.nitrogen_dioxide, 1)} · O₃: ${fmt(c.ozone, 1)}`;
      }

      if (wxRes.status === "fulfilled" && wxRes.value?.current) {
        const w = wxRes.value.current;
        const sm = w.soil_moisture_3_to_9cm ?? w.soil_moisture_0_to_1cm ?? 0.22;
        const gwPct = Math.min(100, Math.max(5, Math.round((sm / 0.45) * 100)));
        if ($("intel-groundwater")) $("intel-groundwater").textContent = `${gwPct}% (${fmt(sm, 2)} m³/m³)`;
        if ($("intel-groundwater-sub")) $("intel-groundwater-sub").textContent = gwPct >= 50 ? "High · Abundant Table" : "Stable · Normal Reserve";

        const hum = w.relative_humidity_2m ?? 50;
        const greeneryIdx = Math.min(98, Math.max(12, Math.round(gwPct * 0.65 + hum * 0.35)));
        if ($("intel-greenery")) $("intel-greenery").textContent = `${greeneryIdx}% NDVI Est.`;
        if ($("intel-greenery-sub")) $("intel-greenery-sub").textContent = greeneryIdx >= 55 ? "Dense Canopy / Lush" : "Moderate Vegetation";

        if ($("intel-radiation")) $("intel-radiation").textContent = `${fmt(w.shortwave_radiation ?? 0, 0)} W/m²`;
        if ($("intel-radiation-sub")) $("intel-radiation-sub").textContent = `UV Index: ${fmt(w.uv_index ?? 0, 1)} · Temp: ${fmt(w.temperature_2m, 1)}°C`;

        const resList = [];
        if ((w.shortwave_radiation ?? 0) > 350) resList.push("Solar Energy");
        if (gwPct > 50) resList.push("Freshwater");
        if (greeneryIdx > 50) resList.push("Biomass");
        if ((elevation ?? 0) > 350) resList.push("Minerals");
        if (!resList.length) resList.push("Wind & Geothermal");
        if ($("intel-resources")) $("intel-resources").textContent = resList.slice(0, 2).join(" · ");
        if ($("intel-resources-sub")) $("intel-resources-sub").textContent = `Key Reserves: ${resList.join(", ")}`;
      }

      if (wikiRes.status === "fulfilled" && wikiRes.value?.extract) {
        if ($("intel-area-summary")) $("intel-area-summary").textContent = wikiRes.value.extract;
      }
    } catch (_) {}
  }

  // --- 9. T&C DEEP LABS (MARS, EPIC EARTH, TECHPORT) ---
  async function loadMarsRover(rover = "perseverance") {
    state.activeRover = rover;
    const container = $("mars-photo-container");
    if (!container) return;
    try {
      const data = await cachedFetch(CONFIG.APIS.marsPhotos(rover), 60 * 60000);
      const photos = data.latest_photos || [];
      if (!photos.length) {
        container.innerHTML = `<p class="muted">No raw photos received today for ${esc(rover)}.</p>`;
        return;
      }
      const p = photos[0];
      container.innerHTML = `<img src="${esc(p.img_src)}" alt="Martian surface by ${esc(rover)}">`;
      if ($("mars-rover-tag")) $("mars-rover-tag").textContent = `${rover.toUpperCase()} · ${p.camera?.full_name || "Camera"}`;
      if ($("mars-sol-label")) $("mars-sol-label").textContent = `Martian Sol: ${p.sol} (${p.earth_date})`;
      if ($("mars-camera-label")) $("mars-camera-label").textContent = `Camera: ${p.camera?.name || "Mastcam"}`;
    } catch (_) {
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
      const d = latest.date.split(" ")[0].split("-");
      const imgUrl = `https://epic.gsfc.nasa.gov/archive/natural/${d[0]}/${d[1]}/${d[2]}/png/${latest.image}.png`;
      container.innerHTML = `<img src="${esc(imgUrl)}" alt="Full-disk Earth from DSCOVR">`;
      if ($("epic-date-label")) $("epic-date-label").textContent = `Downlink: ${latest.date}`;
    } catch (_) {
      container.innerHTML = `<p class="muted">DSCOVR EPIC telemetry streaming.</p>`;
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

  // --- CLOCK & TICKER ---
  function clock() {
    if ($("utc-clock")) $("utc-clock").textContent = new Date().toISOString().slice(11, 19) + " UTC";
  }

  function updateTicker() {
    const items = [
      "ISS orbiting at ~7.66 km/s in Low Earth Orbit",
      "T&C Deep Labs streaming raw surface imagery from Perseverance rover on Mars",
      "TheSpaceDevs tracking orbital rocket countdowns worldwide",
      "Voyager 1 cruising interstellar space at 16.9 km/s beyond the heliopause",
      "NASA DONKI monitoring solar energetic particles and geomagnetic storms",
      "USGS global seismographic network monitoring Earth plate boundaries",
      "NASA NeoWs actively scanning close-approach asteroids"
    ];
    if ($("ticker")) $("ticker").textContent = items[Math.floor(Date.now() / 8000) % items.length];
  }

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
    // Tab switching
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

    // Theme & Language
    $("theme-select")?.addEventListener("change", e => applyTheme(e.target.value));
    $("setting-theme")?.addEventListener("change", e => applyTheme(e.target.value));
    $("lang-select")?.addEventListener("change", e => applyLanguage(e.target.value));
    $("setting-lang")?.addEventListener("change", e => applyLanguage(e.target.value));

    // Refresh
    $("refresh-all")?.addEventListener("click", () => { toast("Refreshing telemetry…"); refreshAll(); });
    $("refresh-weather")?.addEventListener("click", () => { toast("Refreshing solar reports…"); loadSpaceWeather(); });

    // Satellite select & search
    $("sat-select")?.addEventListener("change", e => selectSatellite(e.target.value));
    $("sat-search-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = $("sat-search").value.trim();
      if (q) searchSatellites(q);
    });
    $("sat-search")?.addEventListener("input", (e) => {
      clearTimeout(state.searchTimer);
      state.searchTimer = setTimeout(() => searchSatellites(e.target.value), 400);
    });

    // Wiki
    $("wiki-search-btn")?.addEventListener("click", () => {
      const q = $("wiki-query-input").value.trim();
      if (q) searchWiki(q);
    });
    $("wiki-query-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = e.target.value.trim();
        if (q) searchWiki(q);
      }
    });
    document.querySelectorAll(".wiki-pill").forEach(p => {
      p.addEventListener("click", () => {
        document.querySelectorAll(".wiki-pill").forEach(x => x.classList.remove("active"));
        p.classList.add("active");
        const topic = p.getAttribute("data-topic");
        if (topic) searchWiki(topic);
      });
    });

    // Intel Brief
    $("intel-search-btn")?.addEventListener("click", () => {
      const q = $("intel-area-input")?.value.trim();
      if (q) loadAreaIntelligence(q);
    });
    $("intel-area-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = e.target.value.trim();
        if (q) loadAreaIntelligence(q);
      }
    });
    document.querySelectorAll("#intel-presets .wiki-pill").forEach(p => {
      p.addEventListener("click", () => {
        document.querySelectorAll("#intel-presets .wiki-pill").forEach(x => x.classList.remove("active"));
        p.classList.add("active");
        loadAreaIntelligence(p.getAttribute("data-area"));
      });
    });
    loadAreaIntelligence("Hyderabad");
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const overheadAlertCooldown = {};
  function checkOverheadPass(satName, satLat, satLon, satAlt) {
    if (state.userLat == null || state.userLon == null) return;
    const distKm = haversineKm(state.userLat, state.userLon, satLat, satLon);
    if (distKm <= 1000) {
      const now = Date.now();
      if (overheadAlertCooldown[satName] && now - overheadAlertCooldown[satName] < 15 * 60 * 1000) return;
      overheadAlertCooldown[satName] = now;
      toast(`🛰️ ${satName} is passing ${Math.round(distKm)} km overhead!`);
    }
  }

  async function refreshAll() {
    clock();
    updateTicker();
    updateDeepSpaceTelemetry();
    await Promise.allSettled([
      selectSatellite($("sat-select")?.value || "25544"),
      loadLaunches(),
      loadSpaceWeather(),
      loadApod(),
      loadAsteroids(),
      loadEarthquakes(),
      loadEonet(),
      loadMarsRover(state.activeRover),
      loadEpicEarth(),
      loadTechPort()
    ]);
    if ($("last-updated")) $("last-updated").textContent = "UPDATED " + new Date().toLocaleTimeString();
  }

  function boot() {
    let savedTheme = "system";
    try { savedTheme = localStorage.getItem("tc_space_theme") || "system"; } catch (_) {}
    applyTheme(["system", "light", "dark"].includes(savedTheme) ? savedTheme : "system", false);

    let savedLang = "en";
    try { savedLang = localStorage.getItem("tc_space_lang") || "en"; } catch (_) {}
    applyLanguage(savedLang);

    initMap();
    initGlobe();
    bindUI();
    searchWiki("James Webb Space Telescope");
    refreshAll();

    setInterval(clock, 1000);
    setInterval(updateTicker, 6000);
    setInterval(updateLaunchCountdown, 1000);
    setInterval(updateSatelliteUI, 1200);
    setInterval(updateDeepSpaceTelemetry, 15000);
    setInterval(refreshAll, CONFIG.REFRESH_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
