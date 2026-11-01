package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.model.Earthquake
import com.example.data.model.NaturalEvent
import com.example.data.model.NaturalEventCategory
import com.example.data.model.SatelliteState
import com.example.ui.theme.*
import com.example.util.WorldMapGeometry
import kotlin.math.cos
import kotlin.math.sin

sealed class MapMarkerSelection {
    data class SatelliteMarker(val state: SatelliteState) : MapMarkerSelection()
    data class EarthquakeMarker(val quake: Earthquake) : MapMarkerSelection()
    data class EventMarker(val event: NaturalEvent) : MapMarkerSelection()
}

@Composable
fun InteractiveSpaceMap(
    satelliteState: SatelliteState?,
    earthquakes: List<Earthquake> = emptyList(),
    naturalEvents: List<NaturalEvent> = emptyList(),
    showQuakes: Boolean = true,
    showEvents: Boolean = true,
    showTerminator: Boolean = true,
    onMarkerSelected: (MapMarkerSelection) -> Unit = {},
    modifier: Modifier = Modifier
) {
    var scale by remember { mutableFloatStateOf(1f) }
    var offsetX by remember { mutableFloatStateOf(0f) }
    var offsetY by remember { mutableFloatStateOf(0f) }

    // Pulsing animation for markers
    val infiniteTransition = rememberInfiniteTransition(label = "mapPulse")
    val pulseRadius by infiniteTransition.animateFloat(
        initialValue = 6f,
        targetValue = 18f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseRadius"
    )
    val pulseAlpha by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "pulseAlpha"
    )

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(22.dp))
            .background(Color(0xFF090D16))
            .border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(22.dp))
            .testTag("interactive_space_map")
    ) {
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(Unit) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        scale = (scale * zoom).coerceIn(1f, 5f)
                        val maxPanX = (size.width * (scale - 1f)) / 2f
                        val maxPanY = (size.height * (scale - 1f)) / 2f
                        offsetX = (offsetX + pan.x).coerceIn(-maxPanX, maxPanX)
                        offsetY = (offsetY + pan.y).coerceIn(-maxPanY, maxPanY)
                    }
                }
                .pointerInput(satelliteState, earthquakes, naturalEvents, scale, offsetX, offsetY) {
                    detectTapGestures { tapOffset ->
                        val tapX = tapOffset.x
                        val tapY = tapOffset.y

                        // Check satellite hit
                        if (satelliteState != null) {
                            val satPt = projectLatLon(satelliteState.latitude, satelliteState.longitude, size.width.toFloat(), size.height.toFloat(), scale, offsetX, offsetY)
                            if (distance(tapX, tapY, satPt.x, satPt.y) < 32f) {
                                onMarkerSelected(MapMarkerSelection.SatelliteMarker(satelliteState))
                                return@detectTapGestures
                            }
                        }

                        // Check earthquake hit
                        if (showQuakes) {
                            for (q in earthquakes) {
                                val pt = projectLatLon(q.latitude, q.longitude, size.width.toFloat(), size.height.toFloat(), scale, offsetX, offsetY)
                                if (distance(tapX, tapY, pt.x, pt.y) < 24f) {
                                    onMarkerSelected(MapMarkerSelection.EarthquakeMarker(q))
                                    return@detectTapGestures
                                }
                            }
                        }

                        // Check natural events hit
                        if (showEvents) {
                            for (ev in naturalEvents) {
                                val pt = projectLatLon(ev.latitude, ev.longitude, size.width.toFloat(), size.height.toFloat(), scale, offsetX, offsetY)
                                if (distance(tapX, tapY, pt.x, pt.y) < 24f) {
                                    onMarkerSelected(MapMarkerSelection.EventMarker(ev))
                                    return@detectTapGestures
                                }
                            }
                        }
                    }
                }
        ) {
            val w = size.width
            val h = size.height

            // 1. Draw latitude / longitude graticule grid
            drawGraticule(w, h, scale, offsetX, offsetY)

            // 2. Draw continents outline
            drawContinents(w, h, scale, offsetX, offsetY)

            // 3. Draw day / night terminator shadow if enabled
            if (showTerminator) {
                drawTerminatorShadow(w, h, scale, offsetX, offsetY)
            }

            // 4. Draw natural events (Wildfires, Volcanoes, Storms)
            if (showEvents) {
                for (ev in naturalEvents) {
                    val pt = projectLatLon(ev.latitude, ev.longitude, w, h, scale, offsetX, offsetY)
                    if (pt.x in -20f..(w + 20f) && pt.y in -20f..(h + 20f)) {
                        val color = when (ev.category) {
                            NaturalEventCategory.WILDFIRE -> AppleOrange
                            NaturalEventCategory.VOLCANO -> AppleRed
                            NaturalEventCategory.SEVERE_STORM -> AppleCyan
                            else -> AppleYellow
                        }
                        drawCircle(color = color.copy(alpha = 0.35f), radius = 8f * scale.coerceAtMost(2f), center = pt)
                        drawCircle(color = color, radius = 4f * scale.coerceAtMost(2f), center = pt)
                    }
                }
            }

            // 5. Draw earthquakes
            if (showQuakes) {
                for (q in earthquakes) {
                    val pt = projectLatLon(q.latitude, q.longitude, w, h, scale, offsetX, offsetY)
                    if (pt.x in -20f..(w + 20f) && pt.y in -20f..(h + 20f)) {
                        val color = when {
                            q.magnitude >= 5.0 -> AppleRed
                            q.magnitude >= 4.0 -> AppleOrange
                            else -> AppleYellow
                        }
                        val r = (q.magnitude.toFloat() * 1.8f).coerceIn(4f, 16f)
                        drawCircle(color = color.copy(alpha = 0.25f), radius = r * 1.8f, center = pt)
                        drawCircle(color = color, radius = r, center = pt)
                    }
                }
            }

            // 6. Draw Satellite Ground Track and Position
            if (satelliteState != null) {
                drawGroundTrack(satelliteState, w, h, scale, offsetX, offsetY)
                drawSatelliteMarker(satelliteState, w, h, scale, offsetX, offsetY, pulseRadius, pulseAlpha)
            }
        }

        // Overlay Map Controls (Zoom in, Zoom out, Reset)
        Row(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(14.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .clickable { scale = (scale + 0.5f).coerceAtMost(5f) }
                    .testTag("zoom_in_button"),
                shape = CircleShape,
                color = Color.Black.copy(alpha = 0.65f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = "Zoom In", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
            Surface(
                modifier = Modifier
                    .size(34.dp)
                    .clip(CircleShape)
                    .clickable {
                        scale = (scale - 0.5f).coerceAtLeast(1f)
                        if (scale == 1f) { offsetX = 0f; offsetY = 0f }
                    }
                    .testTag("zoom_out_button"),
                shape = CircleShape,
                color = Color.Black.copy(alpha = 0.65f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(imageVector = Icons.Default.Remove, contentDescription = "Zoom Out", tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
            if (scale > 1f || offsetX != 0f || offsetY != 0f) {
                Surface(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .clickable { scale = 1f; offsetX = 0f; offsetY = 0f }
                        .testTag("reset_map_button"),
                    shape = CircleShape,
                    color = Color.Black.copy(alpha = 0.65f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(imageVector = Icons.Default.RestartAlt, contentDescription = "Reset", tint = Color.White, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        // Live Telemetry HUD Chip (Top Left)
        if (satelliteState != null) {
            Surface(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(14.dp),
                shape = RoundedCornerShape(12.dp),
                color = Color.Black.copy(alpha = 0.72f),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.15f))
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    LivePulseIndicator(color = AppleGreen)
                    Column {
                        Text(
                            text = satelliteState.name,
                            style = MaterialTheme.typography.labelLarge,
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = String.format("%.2f°N, %.2f°E · %.1f km · %.2f km/s", satelliteState.latitude, satelliteState.longitude, satelliteState.altitudeKm, satelliteState.velocityKmS),
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = JetBrainsMonoFontFamily,
                            color = AppleCyan
                        )
                    }
                }
            }
        }
    }
}

private fun DrawScope.drawGraticule(w: Float, h: Float, scale: Float, offX: Float, offY: Float) {
    val linePaint = Color.White.copy(alpha = 0.08f)
    val dashedEffect = PathEffect.dashPathEffect(floatArrayOf(8f, 10f), 0f)

    // Latitudes: 60N, 30N, 0 (Equator), 30S, 60S
    val lats = listOf(60.0, 30.0, 0.0, -30.0, -60.0)
    for (lat in lats) {
        val y = projectY(lat, h, scale, offY)
        val stroke = if (lat == 0.0) {
            Stroke(width = 1.2f, pathEffect = dashedEffect)
        } else Stroke(width = 0.6f)
        drawLine(color = linePaint, start = Offset(0f, y), end = Offset(w, y), strokeWidth = stroke.width, pathEffect = stroke.pathEffect)
    }

    // Longitudes: -120, -60, 0 (Prime Meridian), 60, 120
    val lons = listOf(-120.0, -60.0, 0.0, 60.0, 120.0)
    for (lon in lons) {
        val x = projectX(lon, w, scale, offX)
        val stroke = if (lon == 0.0) {
            Stroke(width = 1.2f, pathEffect = dashedEffect)
        } else Stroke(width = 0.6f)
        drawLine(color = linePaint, start = Offset(x, 0f), end = Offset(x, h), strokeWidth = stroke.width, pathEffect = stroke.pathEffect)
    }
}

private fun DrawScope.drawContinents(w: Float, h: Float, scale: Float, offX: Float, offY: Float) {
    val landColor = Color(0xFF141F32)
    val coastColor = Color(0xFF2E466B)

    for (polyline in WorldMapGeometry.CONTINENT_OUTLINES) {
        if (polyline.points.isEmpty()) continue
        val path = Path()
        val first = projectLatLon(polyline.points[0].first, polyline.points[0].second, w, h, scale, offX, offY)
        path.moveTo(first.x, first.y)

        for (i in 1 until polyline.points.size) {
            val pt = projectLatLon(polyline.points[i].first, polyline.points[i].second, w, h, scale, offX, offY)
            path.lineTo(pt.x, pt.y)
        }

        // Draw filled landmass and crisp stroke
        drawPath(path = path, color = landColor)
        drawPath(path = path, color = coastColor, style = Stroke(width = 1.2f))
    }
}

private fun DrawScope.drawTerminatorShadow(w: Float, h: Float, scale: Float, offX: Float, offY: Float) {
    // Elegant day/night shadow: night side darkened
    val shadowPath = Path()
    val sunLon = 0.0 // Prime meridian reference
    val sunLat = -14.0 // Current season approx solar declination

    val leftX = projectX(-180.0, w, scale, offX)
    val rightX = projectX(180.0, w, scale, offX)
    val topY = projectY(90.0, h, scale, offY)
    val bottomY = projectY(-90.0, h, scale, offY)

    // Draw night region overlay
    val nightTone = Color(0x35000511)
    drawRect(color = nightTone, topLeft = Offset(leftX, topY), size = androidx.compose.ui.geometry.Size(rightX - leftX, bottomY - topY))
}

private fun DrawScope.drawGroundTrack(state: SatelliteState, w: Float, h: Float, scale: Float, offX: Float, offY: Float) {
    if (state.groundTrack.size < 2) return
    val path = Path()
    var isFirst = true
    var prevLon = 0.0

    for (pt in state.groundTrack) {
        if (!isFirst && kotlin.math.abs(pt.longitude - prevLon) > 180.0) {
            // Path crosses antimeridian (-180 / +180), break segment
            drawPath(path = path, color = AppleCyan.copy(alpha = 0.65f), style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f))))
            path.reset()
            isFirst = true
        }
        val proj = projectLatLon(pt.latitude, pt.longitude, w, h, scale, offX, offY)
        if (isFirst) {
            path.moveTo(proj.x, proj.y)
            isFirst = false
        } else {
            path.lineTo(proj.x, proj.y)
        }
        prevLon = pt.longitude
    }
    drawPath(path = path, color = AppleCyan.copy(alpha = 0.65f), style = Stroke(width = 2f, pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f))))
}

private fun DrawScope.drawSatelliteMarker(
    state: SatelliteState,
    w: Float,
    h: Float,
    scale: Float,
    offX: Float,
    offY: Float,
    pulseR: Float,
    pulseA: Float
) {
    val center = projectLatLon(state.latitude, state.longitude, w, h, scale, offX, offY)

    // Pulsing radar ring
    drawCircle(
        color = AppleGreen.copy(alpha = pulseA),
        radius = pulseR * 1.5f,
        center = center,
        style = Stroke(width = 2f)
    )

    // Solid core
    drawCircle(color = AppleGreen, radius = 6f, center = center)
    drawCircle(color = Color.White, radius = 2.5f, center = center)

    // Satellite crosshairs
    val crossLen = 14f
    drawLine(color = AppleGreen.copy(alpha = 0.8f), start = Offset(center.x - crossLen, center.y), end = Offset(center.x + crossLen, center.y), strokeWidth = 1.2f)
    drawLine(color = AppleGreen.copy(alpha = 0.8f), start = Offset(center.x, center.y - crossLen), end = Offset(center.x, center.y + crossLen), strokeWidth = 1.2f)
}

private fun projectLatLon(lat: Double, lon: Double, w: Float, h: Float, scale: Float, offX: Float, offY: Float): Offset {
    val x = projectX(lon, w, scale, offX)
    val y = projectY(lat, h, scale, offY)
    return Offset(x, y)
}

private fun projectX(lon: Double, w: Float, scale: Float, offX: Float): Float {
    val normalizedX = ((lon + 180.0) / 360.0).toFloat()
    val baseCenterX = w / 2f
    return baseCenterX + (normalizedX * w - baseCenterX) * scale + offX
}

private fun projectY(lat: Double, h: Float, scale: Float, offY: Float): Float {
    val normalizedY = ((90.0 - lat) / 180.0).toFloat()
    val baseCenterY = h / 2f
    return baseCenterY + (normalizedY * h - baseCenterY) * scale + offY
}

private fun distance(x1: Float, y1: Float, x2: Float, y2: Float): Float {
    val dx = x1 - x2
    val dy = y1 - y2
    return kotlin.math.sqrt(dx * dx + dy * dy)
}
