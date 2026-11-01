package com.example.data.model

data class CelesTrakOmm(
    val OBJECT_NAME: String? = null,
    val OBJECT_ID: String? = null,
    val NORAD_CAT_ID: Int? = null,
    val EPOCH: String? = null,
    val MEAN_MOTION: Double? = null, // revs/day
    val ECCENTRICITY: Double? = null,
    val INCLINATION: Double? = null, // degrees
    val RA_OF_ASC_NODE: Double? = null, // degrees
    val ARG_OF_PERICENTER: Double? = null, // degrees
    val MEAN_ANOMALY: Double? = null, // degrees
    val SEMIMAJOR_AXIS: Double? = null, // km
    val PERIOD: Double? = null // minutes
)

data class GroundTrackPoint(
    val latitude: Double,
    val longitude: Double,
    val timestamp: Long = 0L
)

data class SatelliteState(
    val noradId: Int,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val altitudeKm: Double,
    val velocityKmS: Double,
    val periodMinutes: Double,
    val inclinationDeg: Double,
    val epoch: String,
    val groundTrack: List<GroundTrackPoint> = emptyList(),
    val rawOmm: CelesTrakOmm? = null
)
