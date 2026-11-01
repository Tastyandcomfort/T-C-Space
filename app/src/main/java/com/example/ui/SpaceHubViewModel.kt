package com.example.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.model.*
import com.example.data.repository.SpaceHubRepository
import com.example.util.AppLanguage
import com.example.util.AppearanceMode
import com.example.util.NotificationHelper
import com.example.util.StringsHelper
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class SpaceHubViewModel(
    private val repository: SpaceHubRepository = SpaceHubRepository()
) : ViewModel() {

    val selectedSatellite: StateFlow<SatelliteState?> = repository.selectedSatelliteState
    val apod: StateFlow<ApodItem?> = repository.apod
    val spaceWeather: StateFlow<List<SpaceWeatherEvent>> = repository.spaceWeather
    val nearEarthObjects: StateFlow<List<NeoAsteroid>> = repository.nearEarthObjects
    val earthquakes: StateFlow<List<Earthquake>> = repository.earthquakes
    val naturalEvents: StateFlow<List<NaturalEvent>> = repository.naturalEvents
    val upcomingLaunches: StateFlow<List<RocketLaunch>> = repository.upcomingLaunches
    val deepSpaceProbes: StateFlow<List<DeepSpaceProbe>> = repository.deepSpaceProbes
    val starlinkSample: StateFlow<List<CelesTrakOmm>> = repository.starlinkSample
    val lastUpdatedTime: StateFlow<String> = repository.lastUpdatedTime
    val isRefreshing: StateFlow<Boolean> = repository.isRefreshing
    val presets = repository.presetSatellites

    private val _utcClock = MutableStateFlow<String>("--:--:-- UTC")
    val utcClock: StateFlow<String> = _utcClock.asStateFlow()

    private val _searchResults = MutableStateFlow<List<CelesTrakOmm>>(emptyList())
    val searchResults: StateFlow<List<CelesTrakOmm>> = _searchResults.asStateFlow()

    private val _isSearching = MutableStateFlow<Boolean>(false)
    val isSearching: StateFlow<Boolean> = _isSearching.asStateFlow()

    private val _wikiResult = MutableStateFlow<WikiSummary?>(null)
    val wikiResult: StateFlow<WikiSummary?> = _wikiResult.asStateFlow()

    private val _isWikiLoading = MutableStateFlow<Boolean>(false)
    val isWikiLoading: StateFlow<Boolean> = _isWikiLoading.asStateFlow()

    private val _sunTelemetry = MutableStateFlow<SunTelemetry>(repository.getSunTelemetry())
    val sunTelemetry: StateFlow<SunTelemetry> = _sunTelemetry.asStateFlow()

    private val _autoRefreshEnabled = MutableStateFlow<Boolean>(true)
    val autoRefreshEnabled: StateFlow<Boolean> = _autoRefreshEnabled.asStateFlow()

    // Preferences & Settings: Appearance, Language, Notifications
    private val _appearanceMode = MutableStateFlow<AppearanceMode>(AppearanceMode.DARK)
    val appearanceMode: StateFlow<AppearanceMode> = _appearanceMode.asStateFlow()

    private val _language = MutableStateFlow<AppLanguage>(AppLanguage.ENGLISH)
    val language: StateFlow<AppLanguage> = _language.asStateFlow()

    private val _alertIss = MutableStateFlow<Boolean>(true)
    val alertIss: StateFlow<Boolean> = _alertIss.asStateFlow()

    private val _alertSolar = MutableStateFlow<Boolean>(true)
    val alertSolar: StateFlow<Boolean> = _alertSolar.asStateFlow()

    private val _alertLaunches = MutableStateFlow<Boolean>(true)
    val alertLaunches: StateFlow<Boolean> = _alertLaunches.asStateFlow()

    private val _alertEarthquakes = MutableStateFlow<Boolean>(true)
    val alertEarthquakes: StateFlow<Boolean> = _alertEarthquakes.asStateFlow()

    private var tickerJob: Job? = null

    init {
        // Initial fetch
        refreshData()
        startLiveTicker()
    }

    private fun startLiveTicker() {
        tickerJob?.cancel()
        tickerJob = viewModelScope.launch {
            val sdf = SimpleDateFormat("HH:mm:ss 'UTC'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            var secondsCounter = 0
            while (isActive) {
                _utcClock.value = sdf.format(Date())
                repository.recalculateLivePosition()
                _sunTelemetry.value = repository.getSunTelemetry()

                secondsCounter++
                // Auto refresh every 5 minutes (300 seconds) to be respectful of public APIs
                if (_autoRefreshEnabled.value && secondsCounter >= 300) {
                    secondsCounter = 0
                    refreshData()
                }
                delay(1000L)
            }
        }
    }

    fun refreshData() {
        viewModelScope.launch {
            repository.refreshAll()
        }
    }

    fun toggleAutoRefresh() {
        _autoRefreshEnabled.value = !_autoRefreshEnabled.value
    }

    fun selectSatellite(catNr: Int) {
        viewModelScope.launch {
            repository.selectSatellite(catNr)
        }
    }

    fun loadStarlink() {
        viewModelScope.launch {
            repository.loadStarlinkConstellation()
        }
    }

    fun searchSatellites(query: String) {
        viewModelScope.launch {
            _isSearching.value = true
            val results = repository.searchSatellites(query)
            _searchResults.value = results
            _isSearching.value = false
        }
    }

    fun searchWiki(topic: String) {
        viewModelScope.launch {
            _isWikiLoading.value = true
            val summary = repository.fetchWiki(topic)
            _wikiResult.value = summary
            _isWikiLoading.value = false
        }
    }

    fun setAppearance(mode: AppearanceMode) {
        _appearanceMode.value = mode
    }

    fun setLanguage(lang: AppLanguage) {
        _language.value = lang
    }

    fun toggleAlertIss() { _alertIss.value = !_alertIss.value }
    fun toggleAlertSolar() { _alertSolar.value = !_alertSolar.value }
    fun toggleAlertLaunches() { _alertLaunches.value = !_alertLaunches.value }
    fun toggleAlertEarthquakes() { _alertEarthquakes.value = !_alertEarthquakes.value }

    fun triggerTestNotification(context: Context) {
        val satName = selectedSatellite.value?.name ?: "ISS (ZARYA)"
        NotificationHelper.sendSpaceAlert(
            context = context,
            title = "Space Hub Alert · Live Orbital Update",
            message = "$satName is in tracking range. Velocity: 7.66 km/s, Altitude: 418.5 km. Solar flux: Normal."
        )
    }

    fun t(key: String): String {
        return StringsHelper.getString(key, _language.value)
    }

    override fun onCleared() {
        super.onCleared()
        tickerJob?.cancel()
    }
}
