package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.data.model.NeoAsteroid
import com.example.data.model.SpaceWeatherEvent
import com.example.data.model.SpaceWeatherType
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun SpaceWeatherScreen(
    viewModel: SpaceHubViewModel,
    modifier: Modifier = Modifier
) {
    val spaceWeather by viewModel.spaceWeather.collectAsState()
    val asteroids by viewModel.nearEarthObjects.collectAsState()

    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Solar Events", "Asteroids NeoWs")

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("space_weather_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "SUN–EARTH CONNECTION",
                    title = "Space Weather & Asteroids",
                    subtitle = "Real-time solar flares, geomagnetic storms & near-Earth objects from NASA DONKI & NeoWs",
                    badgeText = "NASA OPEN API"
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        label = "SOLAR EVENTS",
                        value = "${spaceWeather.size}",
                        unit = "active",
                        accentColor = AppleOrange,
                        icon = Icons.Default.WbSunny,
                        modifier = Modifier.weight(1f)
                    )
                    MetricTile(
                        label = "CLOSE ASTEROIDS",
                        value = "${asteroids.size}",
                        unit = "tracked",
                        accentColor = AppleCyan,
                        icon = Icons.Default.Warning,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                AppleSegmentedControl(
                    items = tabs,
                    selectedIndex = selectedTab,
                    onItemSelected = { selectedTab = it },
                    modifier = Modifier.testTag("space_weather_tabs")
                )
            }
        }

        if (selectedTab == 0) {
            if (spaceWeather.isEmpty()) {
                item {
                    AppleCard {
                        Text(
                            text = "No extreme solar events reported in current window. Sun is in standard background solar wind flux.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                items(spaceWeather) { ev ->
                    SpaceWeatherItemCard(event = ev)
                }
            }
        } else {
            if (asteroids.isEmpty()) {
                item {
                    AppleCard {
                        Text(
                            text = "Retrieving NASA NeoWs upcoming close approaches…",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                items(asteroids) { ast ->
                    AsteroidItemCard(asteroid = ast)
                }
            }
        }
    }
}

@Composable
private fun SpaceWeatherItemCard(event: SpaceWeatherEvent) {
    val tagColor = when (event.type) {
        SpaceWeatherType.SOLAR_FLARE -> AppleOrange
        SpaceWeatherType.CORONAL_MASS_EJECTION -> AppleRed
        SpaceWeatherType.GEOMAGNETIC_STORM -> ApplePurple
    }

    AppleCard(modifier = Modifier.testTag("weather_event_${event.id}")) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = when (event.type) {
                    SpaceWeatherType.SOLAR_FLARE -> "SOLAR FLARE"
                    SpaceWeatherType.CORONAL_MASS_EJECTION -> "CORONAL MASS EJECTION"
                    SpaceWeatherType.GEOMAGNETIC_STORM -> "GEOMAGNETIC STORM"
                },
                style = MaterialTheme.typography.labelSmall,
                color = tagColor,
                fontWeight = FontWeight.Bold
            )
            LiveStatusPill(text = event.severityTag, color = tagColor)
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = event.title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Timestamp: ${event.eventDate.replace("T", " ").take(19)} UTC",
            style = MaterialTheme.typography.labelSmall,
            fontFamily = JetBrainsMonoFontFamily,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = event.details,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun AsteroidItemCard(asteroid: NeoAsteroid) {
    AppleCard(
        borderStroke = if (asteroid.isPotentiallyHazardous) AppleRed.copy(alpha = 0.5f) else MaterialTheme.colorScheme.outline,
        modifier = Modifier.testTag("asteroid_${asteroid.id}")
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "NEO ASTEROID",
                style = MaterialTheme.typography.labelSmall,
                color = AppleCyan,
                fontWeight = FontWeight.Bold
            )
            if (asteroid.isPotentiallyHazardous) {
                LiveStatusPill(text = "HAZARDOUS", color = AppleRed)
            } else {
                LiveStatusPill(text = "SAFE APPROACH", color = AppleGreen)
            }
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = asteroid.name,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Approach Date: ${asteroid.closeApproachDate}",
            style = MaterialTheme.typography.labelSmall,
            fontFamily = JetBrainsMonoFontFamily,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(10.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(text = "MISS DISTANCE", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    text = "${String.format("%.2f", asteroid.missDistanceKm / 1e6)} Million km",
                    style = MaterialTheme.typography.bodyMedium,
                    fontFamily = JetBrainsMonoFontFamily,
                    fontWeight = FontWeight.Bold,
                    color = AppleBlue
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(text = "EST. DIAMETER", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(
                    text = "${String.format("%.0f", asteroid.diameterMinMeters)}–${String.format("%.0f", asteroid.diameterMaxMeters)} m",
                    style = MaterialTheme.typography.bodyMedium,
                    fontFamily = JetBrainsMonoFontFamily,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
