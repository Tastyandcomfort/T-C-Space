package com.example.data.api

import com.example.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit

object SpaceApiClient {
    private val client = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(15, TimeUnit.SECONDS)
        .build()

    private const val NASA_KEY = "DEMO_KEY"

    // 1. CelesTrak Satellite OMM
    suspend fun fetchSatelliteOmm(catNr: Int): CelesTrakOmm? = withContext(Dispatchers.IO) {
        val url = "https://celestrak.org/NORAD/elements/gp.php?CATNR=$catNr&FORMAT=JSON"
        try {
            val jsonStr = executeGet(url) ?: return@withContext null
            val arr = JSONArray(jsonStr)
            if (arr.length() == 0) return@withContext null
            parseOmm(arr.getJSONObject(0))
        } catch (_: Exception) {
            null
        }
    }

    suspend fun fetchStarlinkSample(): List<CelesTrakOmm> = withContext(Dispatchers.IO) {
        val url = "https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=JSON"
        try {
            val jsonStr = executeGet(url) ?: return@withContext emptyList()
            val arr = JSONArray(jsonStr)
            val list = mutableListOf<CelesTrakOmm>()
            val count = minOf(arr.length(), 60)
            for (i in 0 until count) {
                list.add(parseOmm(arr.getJSONObject(i)))
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    suspend fun searchSatellitesByName(query: String): List<CelesTrakOmm> = withContext(Dispatchers.IO) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return@withContext emptyList()
        val url = "https://celestrak.org/NORAD/elements/gp.php?NAME=${trimmed}&FORMAT=JSON"
        try {
            val jsonStr = executeGet(url) ?: return@withContext emptyList()
            val arr = JSONArray(jsonStr)
            val list = mutableListOf<CelesTrakOmm>()
            val count = minOf(arr.length(), 20)
            for (i in 0 until count) {
                list.add(parseOmm(arr.getJSONObject(i)))
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    // 2. NASA APOD
    suspend fun fetchApod(): ApodItem? = withContext(Dispatchers.IO) {
        val url = "https://api.nasa.gov/planetary/apod?api_key=$NASA_KEY"
        try {
            val jsonStr = executeGet(url)
            if (jsonStr != null) {
                val json = JSONObject(jsonStr)
                return@withContext ApodItem(
                    title = json.optString("title", "Astronomy Picture of the Day"),
                    date = json.optString("date", ""),
                    explanation = json.optString("explanation", ""),
                    url = json.optString("url", ""),
                    hdUrl = json.optString("hdurl", null),
                    mediaType = json.optString("media_type", "image"),
                    copyright = json.optString("copyright", null)
                )
            }
        } catch (_: Exception) {
            // Fallback to science.nasa.gov endpoint
        }
        try {
            val fallbackUrl = "https://science.nasa.gov/wp-json/wp/v2/apod-basic?date=${currentDateIso()}"
            val fallbackStr = executeGet(fallbackUrl) ?: return@withContext null
            val arr = JSONArray(fallbackStr)
            if (arr.length() > 0) {
                val item = arr.getJSONObject(0)
                return@withContext ApodItem(
                    title = item.optJSONObject("title")?.optString("rendered") ?: item.optString("title", "APOD"),
                    date = item.optString("date", currentDateIso()),
                    explanation = item.optJSONObject("content")?.optString("rendered")?.replace(Regex("<[^>]*>"), "")
                        ?: item.optString("explanation", ""),
                    url = item.optString("featured_image", item.optString("image", ""))
                )
            }
        } catch (_: Exception) {
            null
        }
        null
    }

    // 3. NASA DONKI Space Weather
    suspend fun fetchSpaceWeather(): List<SpaceWeatherEvent> = withContext(Dispatchers.IO) {
        val events = mutableListOf<SpaceWeatherEvent>()
        val (start, end) = getDateRange(daysBack = 7)

        // Solar flares
        try {
            val flrUrl = "https://api.nasa.gov/DONKI/FLR?startDate=$start&endDate=$end&api_key=$NASA_KEY"
            val flrStr = executeGet(flrUrl)
            if (flrStr != null) {
                val arr = JSONArray(flrStr)
                for (i in 0 until minOf(arr.length(), 6)) {
                    val obj = arr.getJSONObject(i)
                    events.add(
                        SpaceWeatherEvent(
                            id = obj.optString("flrID", "FLR-$i"),
                            type = SpaceWeatherType.SOLAR_FLARE,
                            eventDate = obj.optString("beginTime", ""),
                            title = "Solar Flare · Class " + obj.optString("classType", "N/A"),
                            details = "Source: " + obj.optString("sourceLocation", "Sun surface") + " · Peak: " + obj.optString("peakTime", ""),
                            severityTag = obj.optString("classType", "Flare"),
                            sourceLocation = obj.optString("sourceLocation", null)
                        )
                    )
                }
            }
        } catch (_: Exception) {}

        // Coronal Mass Ejections (CME)
        try {
            val cmeUrl = "https://api.nasa.gov/DONKI/CME?startDate=$start&endDate=$end&api_key=$NASA_KEY"
            val cmeStr = executeGet(cmeUrl)
            if (cmeStr != null) {
                val arr = JSONArray(cmeStr)
                for (i in 0 until minOf(arr.length(), 6)) {
                    val obj = arr.getJSONObject(i)
                    events.add(
                        SpaceWeatherEvent(
                            id = obj.optString("activityID", "CME-$i"),
                            type = SpaceWeatherType.CORONAL_MASS_EJECTION,
                            eventDate = obj.optString("startTime", ""),
                            title = "Coronal Mass Ejection (CME)",
                            details = obj.optString("note", "Plasma eruption observed by SOHO/STEREO."),
                            severityTag = "CME Eruption",
                            sourceLocation = obj.optString("sourceLocation", null)
                        )
                    )
                }
            }
        } catch (_: Exception) {}

        // Geomagnetic Storms (GST)
        try {
            val gstUrl = "https://api.nasa.gov/DONKI/GST?startDate=$start&endDate=$end&api_key=$NASA_KEY"
            val gstStr = executeGet(gstUrl)
            if (gstStr != null) {
                val arr = JSONArray(gstStr)
                for (i in 0 until minOf(arr.length(), 6)) {
                    val obj = arr.getJSONObject(i)
                    val kpArr = obj.optJSONArray("allKpIndex")
                    val kpVal = if (kpArr != null && kpArr.length() > 0) kpArr.getJSONObject(0).optDouble("kpIndex", 0.0) else 0.0
                    events.add(
                        SpaceWeatherEvent(
                            id = obj.optString("gstID", "GST-$i"),
                            type = SpaceWeatherType.GEOMAGNETIC_STORM,
                            eventDate = obj.optString("startTime", ""),
                            title = "Geomagnetic Storm · Kp $kpVal",
                            details = "Observed index: $kpVal · Potential satellite drag and auroral activity.",
                            severityTag = "Kp $kpVal"
                        )
                    )
                }
            }
        } catch (_: Exception) {}

        events.sortedByDescending { it.eventDate }
    }

    // 4. NASA NeoWs Asteroids
    suspend fun fetchNearEarthAsteroids(): List<NeoAsteroid> = withContext(Dispatchers.IO) {
        val (start, end) = getDateRange(daysBack = 0, daysForward = 7)
        val url = "https://api.nasa.gov/neo/rest/v1/feed?start_date=$start&end_date=$end&api_key=$NASA_KEY"
        try {
            val jsonStr = executeGet(url) ?: return@withContext emptyList()
            val root = JSONObject(jsonStr)
            val neoMap = root.optJSONObject("near_earth_objects") ?: return@withContext emptyList()
            val list = mutableListOf<NeoAsteroid>()
            val keys = neoMap.keys()
            while (keys.hasNext()) {
                val dateKey = keys.next()
                val arr = neoMap.getJSONArray(dateKey)
                for (i in 0 until arr.length()) {
                    val obj = arr.getJSONObject(i)
                    val id = obj.optString("id", "")
                    val name = obj.optString("name", "Asteroid")
                    val isHazardous = obj.optBoolean("is_potentially_hazardous_asteroid", false)
                    val diamObj = obj.optJSONObject("estimated_diameter")?.optJSONObject("meters")
                    val diamMin = diamObj?.optDouble("estimated_diameter_min", 0.0) ?: 0.0
                    val diamMax = diamObj?.optDouble("estimated_diameter_max", 0.0) ?: 0.0

                    val closeArr = obj.optJSONArray("close_approach_data")
                    var approachDate = dateKey
                    var missKm = 0.0
                    var relVelKmS = 0.0
                    if (closeArr != null && closeArr.length() > 0) {
                        val ca = closeArr.getJSONObject(0)
                        approachDate = ca.optString("close_approach_date_full", dateKey)
                        missKm = ca.optJSONObject("miss_distance")?.optDouble("kilometers", 0.0) ?: 0.0
                        relVelKmS = ca.optJSONObject("relative_velocity")?.optDouble("kilometers_per_second", 0.0) ?: 0.0
                    }

                    list.add(
                        NeoAsteroid(
                            id = id,
                            name = name,
                            closeApproachDate = approachDate,
                            missDistanceKm = missKm,
                            diameterMinMeters = diamMin,
                            diameterMaxMeters = diamMax,
                            relativeVelocityKmS = relVelKmS,
                            isPotentiallyHazardous = isHazardous
                        )
                    )
                }
            }
            list.sortedBy { it.missDistanceKm }.take(15)
        } catch (_: Exception) {
            emptyList()
        }
    }

    // 5. USGS Real-time Earthquakes
    suspend fun fetchEarthquakes(): List<Earthquake> = withContext(Dispatchers.IO) {
        val url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
        try {
            val jsonStr = executeGet(url) ?: return@withContext emptyList()
            val root = JSONObject(jsonStr)
            val features = root.getJSONArray("features")
            val list = mutableListOf<Earthquake>()
            for (i in 0 until minOf(features.length(), 35)) {
                val f = features.getJSONObject(i)
                val id = f.optString("id", "$i")
                val props = f.getJSONObject("properties")
                val mag = props.optDouble("mag", 0.0)
                val place = props.optString("place", "Global location")
                val time = props.optLong("time", System.currentTimeMillis())
                val eventUrl = props.optString("url", "https://earthquake.usgs.gov")

                val geom = f.getJSONObject("geometry")
                val coords = geom.getJSONArray("coordinates")
                val lon = coords.optDouble(0, 0.0)
                val lat = coords.optDouble(1, 0.0)
                val depth = coords.optDouble(2, 0.0)

                list.add(
                    Earthquake(
                        id = id,
                        magnitude = mag,
                        place = place,
                        timeMillis = time,
                        depthKm = depth,
                        latitude = lat,
                        longitude = lon,
                        url = eventUrl
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    // 6. NASA EONET (Natural Events)
    suspend fun fetchNaturalEvents(): List<NaturalEvent> = withContext(Dispatchers.IO) {
        val url = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25"
        try {
            val jsonStr = executeGet(url) ?: return@withContext emptyList()
            val root = JSONObject(jsonStr)
            val eventsArr = root.getJSONArray("events")
            val list = mutableListOf<NaturalEvent>()
            for (i in 0 until eventsArr.length()) {
                val ev = eventsArr.getJSONObject(i)
                val id = ev.optString("id", "$i")
                val title = ev.optString("title", "Natural Event")
                val catArr = ev.optJSONArray("categories")
                val catTitle = if (catArr != null && catArr.length() > 0) catArr.getJSONObject(0).optString("title", "") else ""
                val category = when {
                    catTitle.contains("Wildfire", ignoreCase = true) -> NaturalEventCategory.WILDFIRE
                    catTitle.contains("Volcano", ignoreCase = true) -> NaturalEventCategory.VOLCANO
                    catTitle.contains("Storm", ignoreCase = true) -> NaturalEventCategory.SEVERE_STORM
                    catTitle.contains("Flood", ignoreCase = true) -> NaturalEventCategory.FLOOD
                    catTitle.contains("Ice", ignoreCase = true) -> NaturalEventCategory.SEA_ICE
                    else -> NaturalEventCategory.OTHER
                }

                val geoArr = ev.optJSONArray("geometry")
                var lat = 0.0
                var lon = 0.0
                var date = ""
                if (geoArr != null && geoArr.length() > 0) {
                    val g = geoArr.getJSONObject(0)
                    date = g.optString("date", "")
                    val coords = g.optJSONArray("coordinates")
                    if (coords != null && coords.length() >= 2) {
                        lon = coords.optDouble(0, 0.0)
                        lat = coords.optDouble(1, 0.0)
                    }
                }

                val linkArr = ev.optJSONArray("sources")
                val link = if (linkArr != null && linkArr.length() > 0) linkArr.getJSONObject(0).optString("url", "") else "https://eonet.gsfc.nasa.gov"

                list.add(
                    NaturalEvent(
                        id = id,
                        title = title,
                        category = category,
                        date = date,
                        latitude = lat,
                        longitude = lon,
                        link = link
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    // 7. Upcoming Rocket Launches (Launch Library 2)
    suspend fun fetchUpcomingLaunches(): List<RocketLaunch> = withContext(Dispatchers.IO) {
        val url = "https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=10"
        try {
            val jsonStr = executeGet(url) ?: return@withContext emptyList()
            val root = JSONObject(jsonStr)
            val results = root.getJSONArray("results")
            val list = mutableListOf<RocketLaunch>()
            for (i in 0 until results.length()) {
                val l = results.getJSONObject(i)
                val id = l.optString("id", "$i")
                val name = l.optString("name", "Orbital Launch")
                val net = l.optString("net", "")
                val statusObj = l.optJSONObject("status")
                val statusName = statusObj?.optString("name", "Go for Launch") ?: "Scheduled"

                val providerObj = l.optJSONObject("launch_service_provider")
                val providerName = providerObj?.optString("name", "Launch Provider") ?: "Commercial"

                val rocketObj = l.optJSONObject("rocket")
                val rocketConfig = rocketObj?.optJSONObject("configuration")
                val rocketName = rocketConfig?.optString("name", "Launch Vehicle") ?: "Rocket"

                val padObj = l.optJSONObject("pad")
                val padName = padObj?.optString("name", "Launch Complex") ?: "Spaceport"
                val padLocation = padObj?.optJSONObject("location")?.optString("name", "Global") ?: "Earth"

                val missionObj = l.optJSONObject("mission")
                val missionDesc = missionObj?.optString("description", "Orbital deployment mission.") ?: "Satellite deployment."

                val imgUrl = l.optString("image", null)
                val vidArr = l.optJSONArray("vidURLs")
                val videoUrl = if (vidArr != null && vidArr.length() > 0) vidArr.getJSONObject(0).optString("url", null) else null

                list.add(
                    RocketLaunch(
                        id = id,
                        name = name,
                        netIso = net,
                        status = statusName,
                        provider = providerName,
                        rocket = rocketName,
                        padName = padName,
                        padLocation = padLocation,
                        description = missionDesc,
                        imageUrl = imgUrl,
                        videoUrl = videoUrl
                    )
                )
            }
            list
        } catch (_: Exception) {
            emptyList()
        }
    }

    // 8. Wikipedia REST API
    suspend fun fetchWikipediaSummary(titleQuery: String): WikiSummary? = withContext(Dispatchers.IO) {
        val encoded = titleQuery.trim().replace(" ", "_")
        val url = "https://en.wikipedia.org/api/rest_v1/page/summary/$encoded"
        try {
            val jsonStr = executeGet(url) ?: return@withContext null
            val obj = JSONObject(jsonStr)
            val title = obj.optString("title", titleQuery)
            val displayTitle = obj.optString("displaytitle", title)
            val extract = obj.optString("extract", "")
            val desc = obj.optString("description", null)
            val thumb = obj.optJSONObject("thumbnail")?.optString("source", null)
            val pageUrl = obj.optJSONObject("content_urls")?.optJSONObject("desktop")?.optString("page", "https://en.wikipedia.org/wiki/$encoded") ?: "https://en.wikipedia.org/wiki/$encoded"

            WikiSummary(
                title = title,
                displayTitle = displayTitle.replace(Regex("<[^>]*>"), ""),
                extract = extract,
                description = desc,
                thumbnailUrl = thumb,
                pageUrl = pageUrl
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun parseOmm(obj: JSONObject): CelesTrakOmm {
        return CelesTrakOmm(
            OBJECT_NAME = obj.optString("OBJECT_NAME", "Satellite"),
            OBJECT_ID = obj.optString("OBJECT_ID", null),
            NORAD_CAT_ID = obj.optInt("NORAD_CAT_ID", 0),
            EPOCH = obj.optString("EPOCH", null),
            MEAN_MOTION = obj.optDouble("MEAN_MOTION", 15.5),
            ECCENTRICITY = obj.optDouble("ECCENTRICITY", 0.0005),
            INCLINATION = obj.optDouble("INCLINATION", 51.6),
            RA_OF_ASC_NODE = obj.optDouble("RA_OF_ASC_NODE", 0.0),
            ARG_OF_PERICENTER = obj.optDouble("ARG_OF_PERICENTER", 0.0),
            MEAN_ANOMALY = obj.optDouble("MEAN_ANOMALY", 0.0),
            SEMIMAJOR_AXIS = if (obj.has("SEMIMAJOR_AXIS")) obj.optDouble("SEMIMAJOR_AXIS") else null,
            PERIOD = if (obj.has("PERIOD")) obj.optDouble("PERIOD") else null
        )
    }

    private fun executeGet(url: String): String? {
        val request = Request.Builder()
            .url(url)
            .header("User-Agent", "TC-Space-Hub-Android/1.0 (muralimanohar.co@gmail.com)")
            .build()
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) return null
            return response.body?.string()
        }
    }

    private fun currentDateIso(): String {
        return SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }.format(Date())
    }

    private fun getDateRange(daysBack: Int = 0, daysForward: Int = 0): Pair<String, String> {
        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC"))
        if (daysBack > 0) cal.add(Calendar.DAY_OF_YEAR, -daysBack)
        val start = sdf.format(cal.time)

        cal.time = Date()
        if (daysForward > 0) cal.add(Calendar.DAY_OF_YEAR, daysForward)
        val end = sdf.format(cal.time)

        return Pair(start, end)
    }
}
