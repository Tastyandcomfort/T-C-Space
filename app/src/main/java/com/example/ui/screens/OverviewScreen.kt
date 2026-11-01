package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.R
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun OverviewScreen(
    viewModel: SpaceHubViewModel,
    onNavigateToMap: () -> Unit,
    onNavigateToLaunches: () -> Unit,
    onNavigateToWeather: () -> Unit,
    onNavigateToEarth: () -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedSat by viewModel.selectedSatellite.collectAsState()
    val apod by viewModel.apod.collectAsState()
    val launches by viewModel.upcomingLaunches.collectAsState()
    val spaceWeather by viewModel.spaceWeather.collectAsState()
    val earthquakes by viewModel.earthquakes.collectAsState()
    val naturalEvents by viewModel.naturalEvents.collectAsState()
    val lastUpdated by viewModel.lastUpdatedTime.collectAsState()
    val isRefreshing by viewModel.isRefreshing.collectAsState()
    val utcClock by viewModel.utcClock.collectAsState()
    val autoRefresh by viewModel.autoRefreshEnabled.collectAsState()

    val context = LocalContext.current
    var showApodDetailDialog by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("overview_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Mission Control Header Bar
        item {
            AppleCard(
                borderStroke = MaterialTheme.colorScheme.outline
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Image(
                            painter = painterResource(id = R.drawable.space_hub_logo),
                            contentDescription = "Space Hub Logo",
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                        )
                        Column {
                            Text(
                                text = "SPACE HUB",
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "MISSION CONTROL",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .clickable { viewModel.toggleAutoRefresh() }
                                .testTag("auto_refresh_toggle"),
                            shape = RoundedCornerShape(10.dp),
                            color = if (autoRefresh) AppleBlue.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                LivePulseIndicator(color = if (autoRefresh) AppleBlue else Color.Gray)
                                Text(
                                    text = if (autoRefresh) "AUTO 5M" else "MANUAL",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontFamily = JetBrainsMonoFontFamily,
                                    color = if (autoRefresh) AppleBlue else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }

                        IconButton(
                            onClick = { viewModel.refreshData() },
                            modifier = Modifier
                                .size(36.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                                .testTag("manual_refresh_button")
                        ) {
                            if (isRefreshing) {
                                CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = AppleBlue)
                            } else {
                                Icon(
                                    imageVector = Icons.Default.Refresh,
                                    contentDescription = "Refresh data",
                                    tint = MaterialTheme.colorScheme.onSurface,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        LiveStatusPill(text = "LIVE SYSTEMS READY", color = AppleGreen)
                    }
                    Text(
                        text = utcClock,
                        style = MaterialTheme.typography.labelMedium,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = lastUpdated,
                    style = MaterialTheme.typography.labelSmall,
                    fontFamily = JetBrainsMonoFontFamily,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // 2. Hero Orbital Telemetry Metrics Grid
        item {
            val sat = selectedSat
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        label = "ALTITUDE",
                        value = if (sat != null) String.format("%.1f", sat.altitudeKm) else "—",
                        unit = "km",
                        subtext = sat?.name ?: "Selected Object",
                        accentColor = AppleCyan,
                        icon = Icons.Default.Public,
                        modifier = Modifier.weight(1f).testTag("metric_altitude")
                    )
                    MetricTile(
                        label = "VELOCITY",
                        value = if (sat != null) String.format("%.2f", sat.velocityKmS) else "—",
                        unit = "km/s",
                        subtext = "Orbital Speed",
                        accentColor = ApplePurple,
                        icon = Icons.Default.Speed,
                        modifier = Modifier.weight(1f).testTag("metric_velocity")
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MetricTile(
                        label = "LATITUDE",
                        value = if (sat != null) String.format("%.2f°", sat.latitude) else "—",
                        unit = if ((sat?.latitude ?: 0.0) >= 0) "N" else "S",
                        subtext = "Sub-satellite point",
                        accentColor = AppleOrange,
                        icon = Icons.Default.MyLocation,
                        modifier = Modifier.weight(1f).testTag("metric_latitude")
                    )
                    MetricTile(
                        label = "LONGITUDE",
                        value = if (sat != null) String.format("%.2f°", sat.longitude) else "—",
                        unit = if ((sat?.longitude ?: 0.0) >= 0) "E" else "W",
                        subtext = "Sub-satellite point",
                        accentColor = AppleGreen,
                        icon = Icons.Default.Navigation,
                        modifier = Modifier.weight(1f).testTag("metric_longitude")
                    )
                }
            }
        }

        // 3. Centralized Interactive Map Feature Card with Presets
        item {
            AppleCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "GLOBAL ORBITAL MONITOR",
                            style = MaterialTheme.typography.labelSmall,
                            color = AppleBlue,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Real-time Tracking",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    TextButton(
                        onClick = onNavigateToMap,
                        modifier = Modifier.testTag("open_full_map_button")
                    ) {
                        Text("Full Map")
                        Icon(imageVector = Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(16.dp))
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Presets horizontal selector
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    viewModel.presets.forEach { (catNr, label) ->
                        val isSelected = selectedSat?.noradId == catNr
                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(99.dp))
                                .clickable { viewModel.selectSatellite(catNr) }
                                .testTag("preset_$catNr"),
                            shape = RoundedCornerShape(99.dp),
                            color = if (isSelected) AppleBlue else MaterialTheme.colorScheme.surfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) AppleBlue else MaterialTheme.colorScheme.outline
                            )
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Map canvas preview
                InteractiveSpaceMap(
                    satelliteState = selectedSat,
                    earthquakes = earthquakes.take(15),
                    naturalEvents = naturalEvents.take(15),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(230.dp)
                        .clickable { onNavigateToMap() }
                )

                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Source: CelesTrak GP API (Real-time OMM)",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Epoch: ${selectedSat?.epoch?.take(10) ?: "Live"}",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // 4. Upcoming Rocket Launch Banner
        item {
            val nextLaunch = launches.firstOrNull()
            if (nextLaunch != null) {
                AppleCard(
                    onClick = onNavigateToLaunches,
                    modifier = Modifier.testTag("launch_banner_card")
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "UPCOMING LAUNCH",
                            style = MaterialTheme.typography.labelSmall,
                            color = AppleOrange,
                            fontWeight = FontWeight.Bold
                        )
                        LiveStatusPill(text = nextLaunch.status, color = AppleGreen)
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = nextLaunch.name,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "${nextLaunch.provider} · ${nextLaunch.rocket}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Schedule, contentDescription = null, tint = AppleOrange, modifier = Modifier.size(16.dp))
                        Text(
                            text = "NET: ${nextLaunch.netIso.replace("T", " ").take(19)} UTC",
                            style = MaterialTheme.typography.labelMedium,
                            fontFamily = JetBrainsMonoFontFamily,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }

        // 5. NASA APOD (Astronomy Picture of the Day)
        item {
            val item = apod
            if (item != null) {
                AppleCard(
                    onClick = { showApodDetailDialog = true },
                    modifier = Modifier.testTag("apod_card")
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "NASA · ASTRONOMY PICTURE OF THE DAY",
                            style = MaterialTheme.typography.labelSmall,
                            color = AppleBlue,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = item.date,
                            style = MaterialTheme.typography.labelSmall,
                            fontFamily = JetBrainsMonoFontFamily,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    if (item.url.isNotBlank()) {
                        AsyncImage(
                            model = item.url,
                            contentDescription = item.title,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(14.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                    }

                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = item.explanation,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // 6. Deep Space Telemetry (Voyager 1 & 2)
        item {
            val probes by viewModel.deepSpaceProbes.collectAsState()
            AppleCard {
                SectionHeader(
                    eyebrow = "DEEP SPACE NETWORK",
                    title = "Interstellar Explorers",
                    subtitle = "Real-time computed astronomical telemetry beyond the solar system",
                    badgeText = "ACTIVE DSN"
                )

                Spacer(modifier = Modifier.height(14.dp))

                probes.take(2).forEach { probe ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(MaterialTheme.colorScheme.surfaceVariant)
                            .clickable {
                                try {
                                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(probe.officialUrl))
                                    context.startActivity(intent)
                                } catch (_: Exception) {}
                            }
                            .padding(14.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = probe.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "${String.format("%.1f", probe.distanceAu)} AU",
                                style = MaterialTheme.typography.labelMedium,
                                fontFamily = JetBrainsMonoFontFamily,
                                color = AppleCyan,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(text = "DISTANCE (KM)", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = "${String.format("%.2f", probe.distanceBillionKm)} Billion km",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontFamily = JetBrainsMonoFontFamily,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(text = "LIGHT-TRAVEL TIME", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text(
                                    text = "${String.format("%.1f", probe.lightTravelHours)} hours",
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontFamily = JetBrainsMonoFontFamily,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }

        // 7. T&C Ecosystem Link Badges
        item {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionHeader(
                    eyebrow = "THE T&C ECOSYSTEM",
                    title = "More from T&C",
                    subtitle = "Explore our other independent digital platforms"
                )

                EcosystemCard(
                    title = "T&C Official Platform",
                    description = "Tasty & Comfort main web ecosystem",
                    url = "https://tastyandcomfort.github.io/T-C/",
                    iconLetter = "T&C",
                    accentGradient = Brush.linearGradient(listOf(AppleBlue, AppleCyan)),
                    modifier = Modifier.fillMaxWidth().testTag("tc_main_badge")
                )

                EcosystemCard(
                    title = "T&C News Hub",
                    description = "Global breaking news, insights & updates",
                    url = "https://tastyandcomfort.github.io/news/",
                    iconLetter = "N",
                    accentGradient = Brush.linearGradient(listOf(AppleOrange, AppleYellow)),
                    modifier = Modifier.fillMaxWidth().testTag("tc_news_badge")
                )
            }
        }

        // 8. Open Science Transparency Badges
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "DATA TRANSPARENCY & FREE APIS",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = FontWeight.Bold
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SourceBadge(
                        sourceName = "NASA Open APIs",
                        dataType = "APOD · DONKI · NeoWs",
                        url = "https://api.nasa.gov/",
                        modifier = Modifier.weight(1f)
                    )
                    SourceBadge(
                        sourceName = "CelesTrak",
                        dataType = "SGP4 Orbital Data",
                        url = "https://celestrak.org/",
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    SourceBadge(
                        sourceName = "USGS Earthquake",
                        dataType = "Real-time Seismic Feed",
                        url = "https://earthquake.usgs.gov/",
                        modifier = Modifier.weight(1f)
                    )
                    SourceBadge(
                        sourceName = "NASA EONET",
                        dataType = "Natural Events Tracker",
                        url = "https://eonet.gsfc.nasa.gov/",
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }

    // Full APOD Dialog
    if (showApodDetailDialog && apod != null) {
        val item = apod!!
        AlertDialog(
            onDismissRequest = { showApodDetailDialog = false },
            confirmButton = {
                TextButton(onClick = { showApodDetailDialog = false }) {
                    Text("Close")
                }
            },
            title = {
                Text(text = item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    if (item.url.isNotBlank()) {
                        AsyncImage(
                            model = item.hdUrl ?: item.url,
                            contentDescription = item.title,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                                .clip(RoundedCornerShape(12.dp)),
                            contentScale = ContentScale.Crop
                        )
                    }
                    Text(
                        text = "Date: ${item.date} ${item.copyright?.let { "· © $it" } ?: ""}",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = item.explanation,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        )
    }
}
