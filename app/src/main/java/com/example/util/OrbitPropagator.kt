package com.example.util

import com.example.data.model.CelesTrakOmm
import com.example.data.model.GroundTrackPoint
import com.example.data.model.SatelliteState
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import kotlin.math.*

object OrbitPropagator {
    private const val MU = 398600.4418 // km^3 / s^2 Earth gravitational parameter
    private const val EARTH_RADIUS_KM = 6378.137
    private const val TWO_PI = 2.0 * Math.PI
    private const val OMEGA_E_RAD_PER_SEC = 7.292115e-5 // Earth rotation rad/s

    fun calculateState(omm: CelesTrakOmm, timeMillis: Long = System.currentTimeMillis()): SatelliteState {
        val noradId = omm.NORAD_CAT_ID ?: 25544
        val name = omm.OBJECT_NAME ?: "Object #$noradId"
        val meanMotionRevsPerDay = omm.MEAN_MOTION ?: 15.5
        val eccentricity = omm.ECCENTRICITY ?: 0.0005
        val inclinationDeg = omm.INCLINATION ?: 51.64
        val raanDeg = omm.RA_OF_ASC_NODE ?: 0.0
        val argPerigeeDeg = omm.ARG_OF_PERICENTER ?: 0.0
        val meanAnomalyDeg = omm.MEAN_ANOMALY ?: 0.0

        val nRadPerSec = meanMotionRevsPerDay * TWO_PI / 86400.0
        val semimajorAxis = omm.SEMIMAJOR_AXIS ?: cbrt(MU / (nRadPerSec * nRadPerSec))
        val periodMinutes = omm.PERIOD ?: (1440.0 / meanMotionRevsPerDay)

        val epochMillis = parseEpochToMillis(omm.EPOCH)
        val deltaSec = (timeMillis - epochMillis) / 1000.0

        val (lat, lon, alt, vel) = propagatePoint(
            semimajorAxis = semimajorAxis,
            eccentricity = eccentricity,
            inclinationRad = Math.toRadians(inclinationDeg),
            raanRad = Math.toRadians(raanDeg),
            argPerigeeRad = Math.toRadians(argPerigeeDeg),
            meanAnomalyRad = Math.toRadians(meanAnomalyDeg),
            nRadPerSec = nRadPerSec,
            deltaSec = deltaSec,
            timeMillis = timeMillis
        )

        // Compute ground track points: -30 mins to +90 mins in 3-min increments
        val groundTrack = mutableListOf<GroundTrackPoint>()
        for (offsetMin in -30..90 step 3) {
            val trackTime = timeMillis + offsetMin * 60_000L
            val trackDeltaSec = (trackTime - epochMillis) / 1000.0
            val (tLat, tLon, _, _) = propagatePoint(
                semimajorAxis = semimajorAxis,
                eccentricity = eccentricity,
                inclinationRad = Math.toRadians(inclinationDeg),
                raanRad = Math.toRadians(raanDeg),
                argPerigeeRad = Math.toRadians(argPerigeeDeg),
                meanAnomalyRad = Math.toRadians(meanAnomalyDeg),
                nRadPerSec = nRadPerSec,
                deltaSec = trackDeltaSec,
                timeMillis = trackTime
            )
            groundTrack.add(GroundTrackPoint(latitude = tLat, longitude = tLon, timestamp = trackTime))
        }

        return SatelliteState(
            noradId = noradId,
            name = name,
            latitude = lat,
            longitude = lon,
            altitudeKm = alt,
            velocityKmS = vel,
            periodMinutes = periodMinutes,
            inclinationDeg = inclinationDeg,
            epoch = omm.EPOCH ?: "N/A",
            groundTrack = groundTrack,
            rawOmm = omm
        )
    }

    private fun propagatePoint(
        semimajorAxis: Double,
        eccentricity: Double,
        inclinationRad: Double,
        raanRad: Double,
        argPerigeeRad: Double,
        meanAnomalyRad: Double,
        nRadPerSec: Double,
        deltaSec: Double,
        timeMillis: Long
    ): Quad<Double, Double, Double, Double> {
        var m = (meanAnomalyRad + nRadPerSec * deltaSec) % TWO_PI
        if (m < 0) m += TWO_PI

        // Solve Kepler's equation for E
        var eAnomaly = m
        for (i in 0 until 12) {
            val delta = (eAnomaly - eccentricity * sin(eAnomaly) - m) / (1.0 - eccentricity * cos(eAnomaly))
            eAnomaly -= delta
            if (abs(delta) < 1e-8) break
        }

        // True anomaly nu
        val sinNu = sqrt(1.0 - eccentricity * eccentricity) * sin(eAnomaly) / (1.0 - eccentricity * cos(eAnomaly))
        val cosNu = (cos(eAnomaly) - eccentricity) / (1.0 - eccentricity * cos(eAnomaly))
        val trueAnomaly = atan2(sinNu, cosNu)

        // Orbital radius r
        val r = semimajorAxis * (1.0 - eccentricity * cos(eAnomaly))

        // Argument of latitude u
        val u = argPerigeeRad + trueAnomaly

        // Position in orbital plane
        val xOrb = r * cos(u)
        val yOrb = r * sin(u)

        // Precession of node approx (J2 perturbation)
        val j2PrecessionRate = -2.06474e-5 * cos(inclinationRad) * (EARTH_RADIUS_KM / semimajorAxis).pow(3.5)
        val currentRaan = raanRad + j2PrecessionRate * deltaSec

        // Position in ECI frame
        val xEci = xOrb * cos(currentRaan) - yOrb * cos(inclinationRad) * sin(currentRaan)
        val yEci = xOrb * sin(currentRaan) + yOrb * cos(inclinationRad) * cos(currentRaan)
        val zEci = yOrb * sin(inclinationRad)

        // Geocentric latitude
        val latRad = atan2(zEci, sqrt(xEci * xEci + yEci * yEci))
        val latDeg = Math.toDegrees(latRad)

        // Right ascension
        val raRad = atan2(yEci, xEci)

        // Greenwich Mean Sidereal Time (GMST)
        val gmstRad = computeGmstRad(timeMillis)

        // Sub-satellite Longitude
        var lonRad = raRad - gmstRad
        var lonDeg = Math.toDegrees(lonRad) % 360.0
        if (lonDeg > 180.0) lonDeg -= 360.0
        if (lonDeg < -180.0) lonDeg += 360.0

        val altKm = max(100.0, r - EARTH_RADIUS_KM)
        val velKmS = sqrt(MU * (2.0 / r - 1.0 / semimajorAxis))

        return Quad(latDeg, lonDeg, altKm, velKmS)
    }

    private fun computeGmstRad(timeMillis: Long): Double {
        // Days since J2000.0 (2000-01-01 12:00:00 UTC = 946728000000 ms)
        val d = (timeMillis - 946728000000L) / 86400000.0
        // GMST in degrees = 280.46061837 + 360.98564736629 * d
        val gmstDeg = (280.46061837 + 360.98564736629 * d) % 360.0
        val normalizedDeg = if (gmstDeg < 0) gmstDeg + 360.0 else gmstDeg
        return Math.toRadians(normalizedDeg)
    }

    private fun parseEpochToMillis(epoch: String?): Long {
        if (epoch.isNullOrBlank()) return System.currentTimeMillis() - 10_000L
        return try {
            val clean = epoch.replace("T", " ").substringBefore(".")
            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            sdf.parse(clean)?.time ?: (System.currentTimeMillis() - 10_000L)
        } catch (_: Exception) {
            System.currentTimeMillis() - 10_000L
        }
    }
}

private data class Quad<A, B, C, D>(val first: A, val second: B, val third: C, val fourth: D)
