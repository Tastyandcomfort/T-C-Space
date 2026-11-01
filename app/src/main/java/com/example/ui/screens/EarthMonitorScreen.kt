package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.Earthquake
import com.example.data.model.NaturalEvent
import com.example.data.model.NaturalEventCategory
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun EarthMonitorScreen(
    viewModel: SpaceHubViewModel,
    modifier: Modifier = Modifier
) {
    val earthquakes by viewModel.earthquakes.collectAsState()
    val naturalEvents by viewModel.naturalEvents.collectAsState()
    val sunTelemetry by viewModel.sunTelemetry.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Earthquakes (${earthquakes.size})", "EONET Events (${naturalEvents.size})", "Sun & Solar")

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("earth_monitor_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "PLANETARY SURVEILLANCE",
                    title = "Earth Monitoring Live Feed",
                    subtitle = "Real-time global seismic feeds (USGS) and active environmental events (NASA EONET)",
                    badgeText = "USGS + EONET"
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        label = "SEISMIC EVENTS",
                        value = "${earthquakes.size}",
                        unit = "past 24h",
                        accentColor = AppleOrange,
                        icon = Icons.Default.Warning,
                        modifier = Modifier.weight(1f)
                    )
                    MetricTile(
                        label = "EONET EVENTS",
                        value = "${naturalEvents.size}",
                        unit = "active",
                        accentColor = AppleRed,
                        icon = Icons.Default.LocalFireDepartment,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                AppleSegmentedControl(
                    items = tabs,
                    selectedIndex = selectedTab,
                    onItemSelected = { selectedTab = it },
                    modifier = Modifier.testTag("earth_monitor_tabs")
                )
            }
        }

        when (selectedTab) {
            0 -> {
                // Earthquakes list
                items(earthquakes) { q ->
                    EarthquakeRowCard(quake = q)
                }
            }
            1 -> {
                // Natural events list
                items(naturalEvents) { ev ->
                    NaturalEventRowCard(event = ev)
                }
            }
            2 -> {
                // Sun & Solar Telemetry
                item {
                    AppleCard {
                        SectionHeader(
                            eyebrow = "SOLAR GEOMETRY",
                            title = "Day/Night & Sun Position",
                            subtitle = "Real-time astronomical solar declination and Greenwich hour angle"
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            MetricTile(
                                label = "SOLAR DECLINATION",
                                value = String.format("%.2f°", sunTelemetry.solarDeclinationDeg),
                                subtext = if (sunTelemetry.solarDeclinationDeg >= 0) "Northern Hemisphere Summer" else "Southern Hemisphere Summer",
                                accentColor = AppleYellow,
                                icon = Icons.Default.WbSunny,
                                modifier = Modifier.weight(1f)
                            )
                            MetricTile(
                                label = "HOUR ANGLE",
                                value = String.format("%.1f°", sunTelemetry.greenwichHourAngleDeg),
                                subtext = "Solar Longitude Reference",
                                accentColor = AppleCyan,
                                modifier = Modifier.weight(1f)
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Timestamp: ${sunTelemetry.utcTimestamp}",
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = JetBrainsMonoFontFamily,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EarthquakeRowCard(quake: Earthquake) {
    val context = LocalContext.current
    val magColor = when {
        quake.magnitude >= 5.0 -> AppleRed
        quake.magnitude >= 4.0 -> AppleOrange
        else -> AppleYellow
    }

    AppleCard(
        onClick = {
            try {
                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(quake.url)))
            } catch (_: Exception) {}
        },
        modifier = Modifier.testTag("quake_card_${quake.id}")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = magColor.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = "M ${String.format("%.1f", quake.magnitude)}",
                        style = MaterialTheme.typography.labelLarge,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = magColor,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
                Text(
                    text = "Depth: ${quake.depthKm} km",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, tint = AppleBlue, modifier = Modifier.size(14.dp))
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = quake.place,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Coordinates: ${String.format("%.3f°N, %.3f°E", quake.latitude, quake.longitude)}",
            style = MaterialTheme.typography.labelSmall,
            fontFamily = JetBrainsMonoFontFamily,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun NaturalEventRowCard(event: NaturalEvent) {
    val context = LocalContext.current
    val catColor = when (event.category) {
        NaturalEventCategory.WILDFIRE -> AppleOrange
        NaturalEventCategory.VOLCANO -> AppleRed
        NaturalEventCategory.SEVERE_STORM -> AppleCyan
        else -> AppleYellow
    }

    AppleCard(
        onClick = {
            if (event.link.isNotBlank()) {
                try {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(event.link)))
                } catch (_: Exception) {}
            }
        },
        modifier = Modifier.testTag("eonet_card_${event.id}")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            LiveStatusPill(text = event.category.name.replace("_", " "), color = catColor)
            if (event.link.isNotBlank()) {
                Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, tint = AppleBlue, modifier = Modifier.size(14.dp))
            }
        }

        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = event.title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Reported: ${event.date.take(10)} · Coords: ${String.format("%.2f°, %.2f°", event.latitude, event.longitude)}",
            style = MaterialTheme.typography.labelSmall,
            fontFamily = JetBrainsMonoFontFamily,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
