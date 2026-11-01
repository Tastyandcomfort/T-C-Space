package com.example.data.model

data class Earthquake(
    val id: String,
    val magnitude: Double,
    val place: String,
    val timeMillis: Long,
    val depthKm: Double,
    val latitude: Double,
    val longitude: Double,
    val url: String
)

enum class NaturalEventCategory {
    WILDFIRE,
    VOLCANO,
    SEVERE_STORM,
    FLOOD,
    SEA_ICE,
    OTHER
}

data class NaturalEvent(
    val id: String,
    val title: String,
    val category: NaturalEventCategory,
    val date: String,
    val latitude: Double,
    val longitude: Double,
    val link: String
)

data class SunTelemetry(
    val utcTimestamp: String,
    val solarDeclinationDeg: Double,
    val greenwichHourAngleDeg: Double,
    val isDaylightSample: Boolean
)
