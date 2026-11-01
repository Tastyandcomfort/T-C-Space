package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun SatellitesScreen(
    viewModel: SpaceHubViewModel,
    onNavigateToMap: () -> Unit,
    modifier: Modifier = Modifier
) {
    val selectedSat by viewModel.selectedSatellite.collectAsState()
    val searchResults by viewModel.searchResults.collectAsState()
    val isSearching by viewModel.isSearching.collectAsState()
    val starlinkSample by viewModel.starlinkSample.collectAsState()

    var searchQuery by remember { mutableStateOf("") }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("satellites_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Header & Search
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "CATALOGUE EXPLORER",
                    title = "Search Earth's Satellites",
                    subtitle = "Search by satellite name or NORAD catalog number via CelesTrak GP",
                    badgeText = "CELESTRAK FREE"
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = {
                        searchQuery = it
                        if (it.trim().length >= 2) {
                            viewModel.searchSatellites(it)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("satellite_search_input"),
                    placeholder = { Text("e.g. TIANGONG, NOAA, STARLINK, GPS...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = AppleBlue)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = {
                                searchQuery = ""
                                viewModel.searchSatellites("")
                            }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { viewModel.loadStarlink() },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        modifier = Modifier.weight(1f).testTag("load_starlink_button")
                    ) {
                        Text("Load Starlink Sample", color = AppleBlue, style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }

        // 2. Active Selected Satellite Profile
        item {
            val sat = selectedSat
            if (sat != null) {
                AppleCard(borderStroke = AppleBlue.copy(alpha = 0.5f)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "ACTIVE TRACKING PROFILE",
                                style = MaterialTheme.typography.labelSmall,
                                color = AppleBlue,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = sat.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        LiveStatusPill(text = "TRACKING", color = AppleGreen)
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "NORAD Catalog ID ${sat.noradId} · Epoch: ${sat.epoch}",
                        style = MaterialTheme.typography.labelSmall,
                        fontFamily = JetBrainsMonoFontFamily,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MetricTile(
                            label = "ALTITUDE",
                            value = String.format("%.1f", sat.altitudeKm),
                            unit = "km",
                            accentColor = AppleCyan,
                            modifier = Modifier.weight(1f)
                        )
                        MetricTile(
                            label = "VELOCITY",
                            value = String.format("%.2f", sat.velocityKmS),
                            unit = "km/s",
                            accentColor = ApplePurple,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MetricTile(
                            label = "LATITUDE",
                            value = String.format("%.3f°", sat.latitude),
                            accentColor = AppleOrange,
                            modifier = Modifier.weight(1f)
                        )
                        MetricTile(
                            label = "LONGITUDE",
                            value = String.format("%.3f°", sat.longitude),
                            accentColor = AppleGreen,
                            modifier = Modifier.weight(1f)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    Button(
                        onClick = onNavigateToMap,
                        modifier = Modifier.fillMaxWidth().testTag("view_on_map_button"),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AppleBlue)
                    ) {
                        Text("View Real-Time Ground Track on Map", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // 3. Search Results or Starlink List
        if (isSearching) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AppleBlue)
                }
            }
        } else if (searchResults.isNotEmpty()) {
            item {
                Text(
                    text = "SEARCH RESULTS (${searchResults.size})",
                    style = MaterialTheme.typography.labelSmall,
                    color = AppleBlue,
                    fontWeight = FontWeight.Bold
                )
            }
            items(searchResults) { omm ->
                SatelliteResultItem(
                    omm = omm,
                    isSelected = selectedSat?.noradId == omm.NORAD_CAT_ID,
                    onSelect = { omm.NORAD_CAT_ID?.let { viewModel.selectSatellite(it) } }
                )
            }
        } else if (starlinkSample.isNotEmpty()) {
            item {
                Text(
                    text = "STARLINK CONSTELLATION SAMPLE (${starlinkSample.size})",
                    style = MaterialTheme.typography.labelSmall,
                    color = AppleBlue,
                    fontWeight = FontWeight.Bold
                )
            }
            items(starlinkSample) { omm ->
                SatelliteResultItem(
                    omm = omm,
                    isSelected = selectedSat?.noradId == omm.NORAD_CAT_ID,
                    onSelect = { omm.NORAD_CAT_ID?.let { viewModel.selectSatellite(it) } }
                )
            }
        }
    }
}

@Composable
private fun SatelliteResultItem(
    omm: com.example.data.model.CelesTrakOmm,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onSelect)
            .testTag("sat_result_${omm.NORAD_CAT_ID}"),
        shape = RoundedCornerShape(14.dp),
        color = if (isSelected) AppleBlue.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isSelected) AppleBlue else MaterialTheme.colorScheme.outline
        )
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = omm.OBJECT_NAME ?: "Unknown Satellite",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "NORAD #${omm.NORAD_CAT_ID} · Inclination ${String.format("%.1f°", omm.INCLINATION ?: 0.0)} · Revs/day ${String.format("%.2f", omm.MEAN_MOTION ?: 0.0)}",
                    style = MaterialTheme.typography.labelSmall,
                    fontFamily = JetBrainsMonoFontFamily,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Button(
                onClick = onSelect,
                shape = RoundedCornerShape(99.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isSelected) AppleGreen else AppleBlue
                ),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
            ) {
                Text(if (isSelected) "Tracking" else "Track", style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}
