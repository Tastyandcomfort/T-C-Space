package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.RocketLaunch
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.data.model.RocketLaunch
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun LaunchesScreen(
    viewModel: SpaceHubViewModel,
    modifier: Modifier = Modifier
) {
    val launches by viewModel.upcomingLaunches.collectAsState()
    val deepSpaceProbes by viewModel.deepSpaceProbes.collectAsState()
    val context = LocalContext.current

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("launches_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "GLOBAL MANNED & ORBITAL MISSIONS",
                    title = "Rocket Launches & Schedules",
                    subtitle = "Real-time upcoming flight manifests from Launch Library 2",
                    badgeText = "LL2 FREE API"
                )
            }
        }

        // Deep Space Section
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "DEEP SPACE TELEMETRY",
                    title = "Interstellar & Outer Solar System",
                    subtitle = "Continuously computed coordinates and radio light-travel latency"
                )

                Spacer(modifier = Modifier.height(14.dp))

                deepSpaceProbes.forEach { probe ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .clickable {
                                try {
                                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(probe.officialUrl)))
                                } catch (_: Exception) {}
                            }
                            .padding(bottom = 8.dp),
                        shape = RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant,
                        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
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
                                LiveStatusPill(text = "${String.format("%.2f", probe.distanceAu)} AU", color = AppleCyan)
                            }

                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Destination: ${probe.destination} · Launched: ${probe.launchDate}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            Spacer(modifier = Modifier.height(10.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Text(text = "DISTANCE FROM EARTH", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(
                                        text = "${String.format("%.3f", probe.distanceBillionKm)} Billion km",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontFamily = JetBrainsMonoFontFamily,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(text = "ONE-WAY LIGHT TIME", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(
                                        text = "${String.format("%.2f", probe.lightTravelHours)} hours",
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontFamily = JetBrainsMonoFontFamily,
                                        fontWeight = FontWeight.Bold,
                                        color = ApplePurple
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        // Upcoming Launches Header
        item {
            Text(
                text = "UPCOMING ORBITAL LAUNCHES (${launches.size})",
                style = MaterialTheme.typography.labelSmall,
                color = AppleOrange,
                fontWeight = FontWeight.Bold
            )
        }

        items(launches) { launch ->
            LaunchCardItem(launch = launch)
        }
    }
}

@Composable
private fun LaunchCardItem(launch: RocketLaunch) {
    val context = LocalContext.current
    AppleCard(
        modifier = Modifier.testTag("launch_item_${launch.id}")
    ) {
        if (!launch.imageUrl.isNullOrBlank()) {
            AsyncImage(
                model = launch.imageUrl,
                contentDescription = launch.name,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .clip(RoundedCornerShape(12.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.height(10.dp))
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = launch.provider.uppercase(),
                style = MaterialTheme.typography.labelSmall,
                color = AppleBlue,
                fontWeight = FontWeight.Bold
            )
            LiveStatusPill(text = launch.status, color = AppleGreen)
        }

        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = launch.name,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Vehicle: ${launch.rocket} · Location: ${launch.padLocation}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(Icons.Default.RocketLaunch, contentDescription = null, modifier = Modifier.size(16.dp), tint = AppleOrange)
            Text(
                text = "Target Launch: ${launch.netIso.replace("T", " ").take(19)} UTC",
                style = MaterialTheme.typography.labelMedium,
                fontFamily = JetBrainsMonoFontFamily,
                fontWeight = FontWeight.SemiBold
            )
        }

        if (launch.description.isNotBlank()) {
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = launch.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }

        if (!launch.videoUrl.isNullOrBlank()) {
            Spacer(modifier = Modifier.height(10.dp))
            Button(
                onClick = {
                    try {
                        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(launch.videoUrl)))
                    } catch (_: Exception) {}
                },
                shape = RoundedCornerShape(10.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AppleRed)
            ) {
                Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Watch Live Broadcast", color = Color.White)
            }
        }
    }
}
