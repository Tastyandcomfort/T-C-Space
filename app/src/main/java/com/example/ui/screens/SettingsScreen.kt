package com.example.ui.screens

import android.Manifest
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.unit.sp
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*
import com.example.util.AppLanguage
import com.example.util.AppearanceMode

@Composable
fun SettingsScreen(
    viewModel: SpaceHubViewModel,
    modifier: Modifier = Modifier
) {
    val appearance by viewModel.appearanceMode.collectAsState()
    val language by viewModel.language.collectAsState()
    val alertIss by viewModel.alertIss.collectAsState()
    val alertSolar by viewModel.alertSolar.collectAsState()
    val alertLaunches by viewModel.alertLaunches.collectAsState()
    val alertEarthquakes by viewModel.alertEarthquakes.collectAsState()

    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            Toast.makeText(context, "Notification permission granted!", Toast.LENGTH_SHORT).show()
            viewModel.triggerTestNotification(context)
        } else {
            Toast.makeText(context, "Notification permission is required to receive live space alerts", Toast.LENGTH_SHORT).show()
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("settings_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Header
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "CONFIGURATION & PREFERENCES",
                    title = viewModel.t("settings"),
                    subtitle = "Customize appearance, global language, and automated space alerts",
                    badgeText = "CUSTOMIZE"
                )
            }
        }

        // 2. Appearance Mode (Dark / Light / System)
        item {
            AppleCard(modifier = Modifier.testTag("appearance_card")) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = viewModel.t("appearance").uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = AppleBlue,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Theme & Color Scheme",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Icon(
                        imageVector = when (appearance) {
                            AppearanceMode.DARK -> Icons.Default.DarkMode
                            AppearanceMode.LIGHT -> Icons.Default.LightMode
                            AppearanceMode.SYSTEM -> Icons.Default.BrightnessAuto
                        },
                        contentDescription = null,
                        tint = AppleBlue
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                val modes = AppearanceMode.values().map { it.label }
                AppleSegmentedControl(
                    items = modes,
                    selectedIndex = appearance.ordinal,
                    onItemSelected = { index ->
                        viewModel.setAppearance(AppearanceMode.values()[index])
                    },
                    modifier = Modifier.testTag("appearance_segmented_control")
                )
            }
        }

        // 3. Language Selector
        item {
            AppleCard(modifier = Modifier.testTag("language_card")) {
                Text(
                    text = viewModel.t("language").uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = AppleCyan,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Select Application Language",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AppLanguage.values().forEach { lang ->
                        val isSelected = language == lang
                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(99.dp))
                                .clickable { viewModel.setLanguage(lang) }
                                .testTag("lang_chip_${lang.code}"),
                            shape = RoundedCornerShape(99.dp),
                            color = if (isSelected) AppleBlue else MaterialTheme.colorScheme.surfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                if (isSelected) AppleBlue else MaterialTheme.colorScheme.outline
                            )
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                if (isSelected) {
                                    Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                                }
                                Text(
                                    text = lang.displayName,
                                    style = MaterialTheme.typography.labelLarge,
                                    color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        }

        // 4. Push Notifications & Space Alert Center
        item {
            AppleCard(modifier = Modifier.testTag("notifications_card")) {
                SectionHeader(
                    eyebrow = "ALERT DISPATCHER",
                    title = viewModel.t("push_alerts"),
                    subtitle = "Automated orbital flybys, severe solar flares, launch countdowns & seismic warnings",
                    badgeText = "CRON & FCM READY"
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Toggle 1: ISS Flybys
                AlertToggleRow(
                    title = viewModel.t("alert_iss"),
                    description = "When ISS elevation is optimal for naked-eye sighting",
                    checked = alertIss,
                    onCheckedChange = { viewModel.toggleAlertIss() }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))

                // Toggle 2: Solar Storms
                AlertToggleRow(
                    title = viewModel.t("alert_solar"),
                    description = "Geomagnetic storm alerts from NASA DONKI",
                    checked = alertSolar,
                    onCheckedChange = { viewModel.toggleAlertSolar() }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))

                // Toggle 3: Launch Countdowns
                AlertToggleRow(
                    title = viewModel.t("alert_launches"),
                    description = "T-15 minute reminders for orbital rocket liftoffs",
                    checked = alertLaunches,
                    onCheckedChange = { viewModel.toggleAlertLaunches() }
                )

                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))

                // Toggle 4: Earthquakes
                AlertToggleRow(
                    title = viewModel.t("alert_earthquake"),
                    description = "Rapid seismic alerts from USGS feed",
                    checked = alertEarthquakes,
                    onCheckedChange = { viewModel.toggleAlertEarthquakes() }
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                        } else {
                            viewModel.triggerTestNotification(context)
                        }
                    },
                    modifier = Modifier.fillMaxWidth().testTag("test_notification_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppleBlue)
                ) {
                    Icon(Icons.Default.NotificationsActive, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(viewModel.t("test_notification"), fontWeight = FontWeight.Bold)
                }
            }
        }

        // 5. Firebase & cron-job.org Integration Guide
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "BACKEND & CRON INTEGRATION",
                    title = "Firebase & Cron-job.org",
                    subtitle = "Automate periodic alerts across the globe"
                )

                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "1. Firebase Cloud Messaging (FCM): This app contains the full NotificationChannel setup. When you add your google-services.json from your Firebase console, your server or cron-job can send push messages to users anytime.\n\n2. Cron-job.org: You can configure a free scheduled job on cron-job.org to ping your webhook every 5 to 15 minutes to evaluate CelesTrak, NASA DONKI, and USGS feeds, triggering automated alerts to your devices!\n\n3. Export & GitHub: You can download the complete ZIP or push to GitHub from the top settings/export menu in AI Studio anytime.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = 22.sp
                )
            }
        }
    }
}

@Composable
private fun AlertToggleRow(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f).padding(end = 12.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = description,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = AppleGreen
            )
        )
    }
}
