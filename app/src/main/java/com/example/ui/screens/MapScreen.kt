package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapScreen(
    viewModel: SpaceHubViewModel,
    modifier: Modifier = Modifier
) {
    val selectedSat by viewModel.selectedSatellite.collectAsState()
    val earthquakes by viewModel.earthquakes.collectAsState()
    val naturalEvents by viewModel.naturalEvents.collectAsState()

    var showQuakes by remember { mutableStateOf(true) }
    var showEvents by remember { mutableStateOf(true) }
    var showTerminator by remember { mutableStateOf(true) }
    var selectedMarker by remember { mutableStateOf<MapMarkerSelection?>(null) }

    val context = LocalContext.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .testTag("map_screen")
            .padding(bottom = 96.dp)
    ) {
        // Controls Header
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 2.dp
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "CENTRALIZED SPACE & EARTH MAP",
                            style = MaterialTheme.typography.labelSmall,
                            color = AppleBlue,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Global Situational Awareness",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    LiveStatusPill(text = "LIVE TELEMETRY", color = AppleGreen)
                }

                // Satellite Presets Scroll
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    viewModel.presets.forEach { (catNr, label) ->
                        val isSelected = selectedSat?.noradId == catNr
                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.selectSatellite(catNr) },
                            label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = AppleBlue,
                                selectedLabelColor = Color.White
                            ),
                            modifier = Modifier.testTag("map_sat_chip_$catNr")
                        )
                    }
                }

                // Layer Toggles
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = showQuakes,
                        onClick = { showQuakes = !showQuakes },
                        label = { Text("Quakes (${earthquakes.size})", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = {
                            Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(14.dp), tint = AppleOrange)
                        },
                        modifier = Modifier.testTag("toggle_quakes_chip")
                    )
                    FilterChip(
                        selected = showEvents,
                        onClick = { showEvents = !showEvents },
                        label = { Text("EONET (${naturalEvents.size})", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = {
                            Icon(Icons.Default.LocalFireDepartment, contentDescription = null, modifier = Modifier.size(14.dp), tint = AppleRed)
                        },
                        modifier = Modifier.testTag("toggle_events_chip")
                    )
                    FilterChip(
                        selected = showTerminator,
                        onClick = { showTerminator = !showTerminator },
                        label = { Text("Day/Night", style = MaterialTheme.typography.labelSmall) },
                        leadingIcon = {
                            Icon(Icons.Default.NightsStay, contentDescription = null, modifier = Modifier.size(14.dp), tint = AppleCyan)
                        },
                        modifier = Modifier.testTag("toggle_terminator_chip")
                    )
                }
            }
        }

        // Full Interactive Canvas Map
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .padding(14.dp)
        ) {
            InteractiveSpaceMap(
                satelliteState = selectedSat,
                earthquakes = earthquakes,
                naturalEvents = naturalEvents,
                showQuakes = showQuakes,
                showEvents = showEvents,
                showTerminator = showTerminator,
                onMarkerSelected = { marker -> selectedMarker = marker },
                modifier = Modifier.fillMaxSize()
            )
        }

        // Bottom Details Sheet / Modal when a marker is tapped
        val marker = selectedMarker
        if (marker != null) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(18.dp)),
                color = MaterialTheme.colorScheme.surfaceVariant,
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        when (marker) {
                            is MapMarkerSelection.SatelliteMarker -> {
                                Text(
                                    text = "SATELLITE PROFILE · ${marker.state.name}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AppleCyan,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            is MapMarkerSelection.EarthquakeMarker -> {
                                Text(
                                    text = "USGS SEISMIC EVENT · M${marker.quake.magnitude}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AppleOrange,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            is MapMarkerSelection.EventMarker -> {
                                Text(
                                    text = "EONET EVENT · ${marker.event.category}",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AppleRed,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        IconButton(onClick = { selectedMarker = null }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Close", modifier = Modifier.size(16.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    when (marker) {
                        is MapMarkerSelection.SatelliteMarker -> {
                            Text(
                                text = "NORAD #${marker.state.noradId} · ${marker.state.name}",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Position: ${String.format("%.3f°N, %.3f°E", marker.state.latitude, marker.state.longitude)} · Altitude: ${String.format("%.1f km", marker.state.altitudeKm)} · Velocity: ${String.format("%.2f km/s", marker.state.velocityKmS)} · Period: ${String.format("%.1f min", marker.state.periodMinutes)}",
                                style = MaterialTheme.typography.bodyMedium,
                                fontFamily = JetBrainsMonoFontFamily
                            )
                        }
                        is MapMarkerSelection.EarthquakeMarker -> {
                            Text(
                                text = marker.quake.place,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Magnitude: ${marker.quake.magnitude} · Depth: ${marker.quake.depthKm} km · Coords: ${marker.quake.latitude}°, ${marker.quake.longitude}°",
                                style = MaterialTheme.typography.bodyMedium,
                                fontFamily = JetBrainsMonoFontFamily
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            TextButton(
                                onClick = {
                                    try {
                                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(marker.quake.url)))
                                    } catch (_: Exception) {}
                                }
                            ) {
                                Text("View on USGS.gov")
                                Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp))
                            }
                        }
                        is MapMarkerSelection.EventMarker -> {
                            Text(
                                text = marker.event.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Category: ${marker.event.category} · Date: ${marker.event.date} · Coords: ${marker.event.latitude}°, ${marker.event.longitude}°",
                                style = MaterialTheme.typography.bodyMedium,
                                fontFamily = JetBrainsMonoFontFamily
                            )
                            if (marker.event.link.isNotBlank()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                TextButton(
                                    onClick = {
                                        try {
                                            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(marker.event.link)))
                                        } catch (_: Exception) {}
                                    }
                                ) {
                                    Text("Open NASA EONET Record")
                                    Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, modifier = Modifier.size(14.dp))
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
