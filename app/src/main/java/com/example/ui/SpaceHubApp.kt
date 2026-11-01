package com.example.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.R
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.util.AppearanceMode

enum class AppDestination(
    val titleKey: String,
    val defaultTitle: String,
    val icon: ImageVector,
    val testTag: String
) {
    OVERVIEW("nav_overview", "Overview", Icons.Default.Dashboard, "nav_overview"),
    MAP("nav_map", "Map", Icons.Default.Public, "nav_map"),
    SATELLITES("nav_satellites", "Satellites", Icons.Default.Sensors, "nav_satellites"),
    LAUNCHES("nav_launches", "Rockets", Icons.Default.RocketLaunch, "nav_launches"),
    SPACE_WEATHER("nav_weather", "Solar", Icons.Default.WbSunny, "nav_weather"),
    EARTH_MONITOR("nav_earth", "Earth", Icons.Default.Warning, "nav_earth"),
    WIKI("nav_wiki", "Wiki Intel", Icons.Default.MenuBook, "nav_wiki"),
    SETTINGS("settings", "Settings", Icons.Default.Settings, "nav_settings")
}

@Composable
fun SpaceHubApp(
    viewModel: SpaceHubViewModel = viewModel()
) {
    val appearance by viewModel.appearanceMode.collectAsState()
    val isSystemDark = isSystemInDarkTheme()
    val isDark = when (appearance) {
        AppearanceMode.DARK -> true
        AppearanceMode.LIGHT -> false
        AppearanceMode.SYSTEM -> isSystemDark
    }

    SpaceHubTheme(darkTheme = isDark) {
        var currentDestination by remember { mutableStateOf(AppDestination.OVERVIEW) }
        val backStack = remember { mutableStateListOf(AppDestination.OVERVIEW) }

        fun navigateTo(dest: AppDestination) {
            if (currentDestination != dest) {
                backStack.add(dest)
                currentDestination = dest
            }
        }

        BackHandler(enabled = backStack.size > 1) {
            backStack.removeLastOrNull()
            currentDestination = backStack.lastOrNull() ?: AppDestination.OVERVIEW
        }

        BoxWithConstraints(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
            val isWideScreen = maxWidth >= 760.dp

            if (isWideScreen) {
                // Tablet / Desktop layout with Navigation Rail
                Row(modifier = Modifier.fillMaxSize()) {
                    NavigationRail(
                        modifier = Modifier
                            .fillMaxHeight()
                            .widthIn(min = 90.dp)
                            .testTag("app_navigation_rail"),
                        containerColor = MaterialTheme.colorScheme.surface,
                        header = {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(top = 16.dp, bottom = 12.dp)
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.space_hub_logo),
                                    contentDescription = "Logo",
                                    modifier = Modifier
                                        .size(46.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                )
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(
                                    text = "SPACE HUB",
                                    style = MaterialTheme.typography.labelSmall,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    ) {
                        AppDestination.values().forEach { dest ->
                            val isSelected = currentDestination == dest
                            val label = viewModel.t(dest.titleKey)
                            NavigationRailItem(
                                selected = isSelected,
                                onClick = { navigateTo(dest) },
                                icon = { Icon(dest.icon, contentDescription = label) },
                                label = { Text(label, style = MaterialTheme.typography.labelSmall) },
                                colors = NavigationRailItemDefaults.colors(
                                    selectedIconColor = AppleBlue,
                                    selectedTextColor = AppleBlue,
                                    indicatorColor = AppleBlue.copy(alpha = 0.15f)
                                ),
                                modifier = Modifier.testTag(dest.testTag)
                            )
                        }
                    }

                    VerticalDivider(color = MaterialTheme.colorScheme.outline)

                    Box(modifier = Modifier.weight(1f).fillMaxHeight()) {
                        ScreenContent(
                            destination = currentDestination,
                            viewModel = viewModel,
                            onNavigate = { navigateTo(it) }
                        )
                    }
                }
            } else {
                // Phone layout with Frosted Floating Bottom Dock Navigation
                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    containerColor = MaterialTheme.colorScheme.background,
                    bottomBar = {
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .windowInsetsPadding(WindowInsets.navigationBars)
                                .testTag("app_bottom_bar"),
                            color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
                            tonalElevation = 8.dp,
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 4.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceAround,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                AppDestination.values().forEach { dest ->
                                    val isSelected = currentDestination == dest
                                    val label = viewModel.t(dest.titleKey)
                                    Column(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .clickable { navigateTo(dest) }
                                            .padding(horizontal = 4.dp, vertical = 4.dp)
                                            .testTag(dest.testTag),
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Icon(
                                            imageVector = dest.icon,
                                            contentDescription = label,
                                            tint = if (isSelected) AppleBlue else MaterialTheme.colorScheme.onSurfaceVariant,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.height(2.dp))
                                        Text(
                                            text = label,
                                            style = MaterialTheme.typography.labelSmall,
                                            color = if (isSelected) AppleBlue else MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                            maxLines = 1
                                        )
                                    }
                                }
                            }
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        ScreenContent(
                            destination = currentDestination,
                            viewModel = viewModel,
                            onNavigate = { navigateTo(it) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ScreenContent(
    destination: AppDestination,
    viewModel: SpaceHubViewModel,
    onNavigate: (AppDestination) -> Unit
) {
    when (destination) {
        AppDestination.OVERVIEW -> {
            OverviewScreen(
                viewModel = viewModel,
                onNavigateToMap = { onNavigate(AppDestination.MAP) },
                onNavigateToLaunches = { onNavigate(AppDestination.LAUNCHES) },
                onNavigateToWeather = { onNavigate(AppDestination.SPACE_WEATHER) },
                onNavigateToEarth = { onNavigate(AppDestination.EARTH_MONITOR) }
            )
        }
        AppDestination.MAP -> {
            MapScreen(viewModel = viewModel)
        }
        AppDestination.SATELLITES -> {
            SatellitesScreen(
                viewModel = viewModel,
                onNavigateToMap = { onNavigate(AppDestination.MAP) }
            )
        }
        AppDestination.LAUNCHES -> {
            LaunchesScreen(viewModel = viewModel)
        }
        AppDestination.SPACE_WEATHER -> {
            SpaceWeatherScreen(viewModel = viewModel)
        }
        AppDestination.EARTH_MONITOR -> {
            EarthMonitorScreen(viewModel = viewModel)
        }
        AppDestination.WIKI -> {
            WikiExploreScreen(viewModel = viewModel)
        }
        AppDestination.SETTINGS -> {
            SettingsScreen(viewModel = viewModel)
        }
    }
}
