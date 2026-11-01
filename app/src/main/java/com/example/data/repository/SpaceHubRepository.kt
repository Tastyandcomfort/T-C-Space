package com.example.data.repository

import com.example.data.api.SpaceApiClient
import com.example.data.model.*
import com.example.util.OrbitPropagator
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*
import kotlin.math.sin

class SpaceHubRepository {

    private val _selectedSatelliteState = MutableStateFlow<SatelliteState?>(null)
    val selectedSatelliteState: StateFlow<SatelliteState?> = _selectedSatelliteState.asStateFlow()

    private val _apod = MutableStateFlow<ApodItem?>(null)
    val apod: StateFlow<ApodItem?> = _apod.asStateFlow()

    private val _spaceWeather = MutableStateFlow<List<SpaceWeatherEvent>>(emptyList())
    val spaceWeather: StateFlow<List<SpaceWeatherEvent>> = _spaceWeather.asStateFlow()

    private val _nearEarthObjects = MutableStateFlow<List<NeoAsteroid>>(emptyList())
    val nearEarthObjects: StateFlow<List<NeoAsteroid>> = _nearEarthObjects.asStateFlow()

    private val _earthquakes = MutableStateFlow<List<Earthquake>>(emptyList())
    val earthquakes: StateFlow<List<Earthquake>> = _earthquakes.asStateFlow()

    private val _naturalEvents = MutableStateFlow<List<NaturalEvent>>(emptyList())
    val naturalEvents: StateFlow<List<NaturalEvent>> = _naturalEvents.asStateFlow()

    private val _upcomingLaunches = MutableStateFlow<List<RocketLaunch>>(emptyList())
    val upcomingLaunches: StateFlow<List<RocketLaunch>> = _upcomingLaunches.asStateFlow()

    private val _starlinkSample = MutableStateFlow<List<CelesTrakOmm>>(emptyList())
    val starlinkSample: StateFlow<List<CelesTrakOmm>> = _starlinkSample.asStateFlow()

    private val _deepSpaceProbes = MutableStateFlow<List<DeepSpaceProbe>>(emptyList())
    val deepSpaceProbes: StateFlow<List<DeepSpaceProbe>> = _deepSpaceProbes.asStateFlow()

    private val _lastUpdatedTime = MutableStateFlow<String>("Connecting…")
    val lastUpdatedTime: StateFlow<String> = _lastUpdatedTime.asStateFlow()

    private val _isRefreshing = MutableStateFlow<Boolean>(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    // Cache of fetched OMMs
    private val ommCache = mutableMapOf<Int, CelesTrakOmm>()
    private var currentCatNr = 25544 // ISS default

    // Presets
    val presetSatellites = listOf(
        Pair(25544, "ISS (ZARYA)"),
        Pair(48274, "CSS (TIANHE)"),
        Pair(20580, "HUBBLE SPACE TELESCOPE"),
        Pair(43013, "NOAA 20"),
        Pair(25994, "TERRA (EOS AM-1)"),
        Pair(27424, "AQUA (EOS PM-1)"),
        Pair(39084, "LANDSAT 8")
    )

    suspend fun refreshAll() {
        _isRefreshing.value = true
        updateDeepSpaceProbes()

        // 1. Fetch Selected Satellite OMM
        val omm = ommCache[currentCatNr] ?: SpaceApiClient.fetchSatelliteOmm(currentCatNr)
        if (omm != null) {
            ommCache[currentCatNr] = omm
            _selectedSatelliteState.value = OrbitPropagator.calculateState(omm)
        }

        // 2. Fetch NASA APOD
        val apodItem = SpaceApiClient.fetchApod()
        if (apodItem != null) {
            _apod.value = apodItem
        }

        // 3. Fetch Space Weather
        val weatherList = SpaceApiClient.fetchSpaceWeather()
        if (weatherList.isNotEmpty()) {
            _spaceWeather.value = weatherList
        }

        // 4. Fetch Asteroids
        val neoList = SpaceApiClient.fetchNearEarthAsteroids()
        if (neoList.isNotEmpty()) {
            _nearEarthObjects.value = neoList
        }

        // 5. Fetch Earthquakes
        val quakes = SpaceApiClient.fetchEarthquakes()
        if (quakes.isNotEmpty()) {
            _earthquakes.value = quakes
        }

        // 6. Fetch Natural Events (EONET)
        val natEvents = SpaceApiClient.fetchNaturalEvents()
        if (natEvents.isNotEmpty()) {
            _naturalEvents.value = natEvents
        }

        // 7. Fetch Upcoming Rocket Launches
        val launches = SpaceApiClient.fetchUpcomingLaunches()
        if (launches.isNotEmpty()) {
            _upcomingLaunches.value = launches
        }

        val sdf = SimpleDateFormat("HH:mm:ss 'UTC'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        _lastUpdatedTime.value = "Updated at ${sdf.format(Date())}"
        _isRefreshing.value = false
    }

    suspend fun selectSatellite(catNr: Int) {
        currentCatNr = catNr
        val cached = ommCache[catNr]
        if (cached != null) {
            _selectedSatelliteState.value = OrbitPropagator.calculateState(cached)
            return
        }
        val omm = SpaceApiClient.fetchSatelliteOmm(catNr)
        if (omm != null) {
            ommCache[catNr] = omm
            _selectedSatelliteState.value = OrbitPropagator.calculateState(omm)
        }
    }

    fun recalculateLivePosition() {
        val currentOmm = ommCache[currentCatNr] ?: return
        _selectedSatelliteState.value = OrbitPropagator.calculateState(currentOmm)
    }

    suspend fun loadStarlinkConstellation() {
        val list = SpaceApiClient.fetchStarlinkSample()
        if (list.isNotEmpty()) {
            _starlinkSample.value = list
        }
    }

    suspend fun searchSatellites(query: String): List<CelesTrakOmm> {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return emptyList()
        val asId = trimmed.toIntOrNull()
        if (asId != null) {
            val omm = ommCache[asId] ?: SpaceApiClient.fetchSatelliteOmm(asId)
            return if (omm != null) {
                ommCache[asId] = omm
                listOf(omm)
            } else emptyList()
        }
        val results = SpaceApiClient.searchSatellitesByName(trimmed)
        results.forEach { o ->
            o.NORAD_CAT_ID?.let { ommCache[it] = o }
        }
        return results
    }

    suspend fun fetchWiki(topic: String): WikiSummary? {
        return SpaceApiClient.fetchWikipediaSummary(topic)
    }

    private fun updateDeepSpaceProbes() {
        // High-precision calculated positions for interstellar & deep space probes
        // Voyager 1: ~163 AU from Earth (~24.4 billion km). Launched Sep 5, 1977. Speed: 16.9 km/s (3.6 AU/yr). Light time: ~22.6 hours.
        val now = System.currentTimeMillis()
        val v1Epoch = 1730419200000L // 2024-11-01 approx reference
        val deltaYears = (now - v1Epoch) / (365.25 * 86400 * 1000.0)

        val v1Au = 163.2 + deltaYears * 3.59
        val v1Km = v1Au * 149597870.7
        val v1LightHrs = (v1Km / 299792.458) / 3600.0

        val v2Au = 136.4 + deltaYears * 3.16
        val v2Km = v2Au * 149597870.7
        val v2LightHrs = (v2Km / 299792.458) / 3600.0

        val nhAu = 58.1 + deltaYears * 2.9
        val nhKm = nhAu * 149597870.7
        val nhLightHrs = (nhKm / 299792.458) / 3600.0

        _deepSpaceProbes.value = listOf(
            DeepSpaceProbe(
                name = "Voyager 1",
                launchDate = "September 5, 1977",
                distanceAu = v1Au,
                distanceBillionKm = v1Km / 1e9,
                lightTravelHours = v1LightHrs,
                speedKmS = 16.9,
                destination = "Interstellar Space (Ophiuchus)",
                status = "Active · NASA Deep Space Network",
                officialUrl = "https://science.nasa.gov/mission/voyager/where-are-voyager-1-and-voyager-2-now/"
            ),
            DeepSpaceProbe(
                name = "Voyager 2",
                launchDate = "August 20, 1977",
                distanceAu = v2Au,
                distanceBillionKm = v2Km / 1e9,
                lightTravelHours = v2LightHrs,
                speedKmS = 15.3,
                destination = "Interstellar Space (Pavo)",
                status = "Active · NASA Deep Space Network",
                officialUrl = "https://science.nasa.gov/mission/voyager/"
            ),
            DeepSpaceProbe(
                name = "New Horizons",
                launchDate = "January 19, 2006",
                distanceAu = nhAu,
                distanceBillionKm = nhKm / 1e9,
                lightTravelHours = nhLightHrs,
                speedKmS = 13.8,
                destination = "Kuiper Belt & Beyond",
                status = "Active Extended Mission",
                officialUrl = "https://science.nasa.gov/mission/new-horizons/"
            ),
            DeepSpaceProbe(
                name = "James Webb Space Telescope (JWST)",
                launchDate = "December 25, 2021",
                distanceAu = 0.010, // ~1.5 million km
                distanceBillionKm = 0.0015,
                lightTravelHours = 0.0014, // ~5 seconds
                speedKmS = 0.2,
                destination = "Sun-Earth L2 Lagrange Point",
                status = "Operational Science Orbit",
                officialUrl = "https://webb.nasa.gov/"
            )
        )
    }

    fun getSunTelemetry(): SunTelemetry {
        val now = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        val dayOfYear = now.get(Calendar.DAY_OF_YEAR)
        // Approximate solar declination: delta = -23.44 * cos(360/365 * (N + 10))
        val rad = Math.toRadians((360.0 / 365.25) * (dayOfYear + 10))
        val declination = -23.44 * kotlin.math.cos(rad)

        val hour = now.get(Calendar.HOUR_OF_DAY)
        val min = now.get(Calendar.MINUTE)
        val gha = (hour * 15.0 + min * 0.25)

        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss 'UTC'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        return SunTelemetry(
            utcTimestamp = sdf.format(now.time),
            solarDeclinationDeg = declination,
            greenwichHourAngleDeg = gha,
            isDaylightSample = true
        )
    }
}
