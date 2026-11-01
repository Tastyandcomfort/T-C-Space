package com.example.data.model

data class ApodItem(
    val title: String,
    val date: String,
    val explanation: String,
    val url: String,
    val hdUrl: String? = null,
    val mediaType: String = "image",
    val copyright: String? = null
)

enum class SpaceWeatherType {
    SOLAR_FLARE,
    CORONAL_MASS_EJECTION,
    GEOMAGNETIC_STORM
}

data class SpaceWeatherEvent(
    val id: String,
    val type: SpaceWeatherType,
    val eventDate: String,
    val title: String,
    val details: String,
    val severityTag: String,
    val sourceLocation: String? = null
)

data class NeoAsteroid(
    val id: String,
    val name: String,
    val closeApproachDate: String,
    val missDistanceKm: Double,
    val diameterMinMeters: Double,
    val diameterMaxMeters: Double,
    val relativeVelocityKmS: Double,
    val isPotentiallyHazardous: Boolean
)

data class RocketLaunch(
    val id: String,
    val name: String,
    val netIso: String,
    val status: String,
    val statusColor: String = "green",
    val provider: String,
    val rocket: String,
    val padName: String,
    val padLocation: String,
    val description: String,
    val imageUrl: String? = null,
    val videoUrl: String? = null
)

data class DeepSpaceProbe(
    val name: String,
    val launchDate: String,
    val distanceAu: Double,
    val distanceBillionKm: Double,
    val lightTravelHours: Double,
    val speedKmS: Double,
    val destination: String,
    val status: String,
    val officialUrl: String
)
