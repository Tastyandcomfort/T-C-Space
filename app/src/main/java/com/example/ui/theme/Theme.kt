package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = AppleBlueLight,
    onPrimary = Color.Black,
    primaryContainer = Color(0xFF132B45),
    onPrimaryContainer = AppleBlueLight,
    secondary = AppleCyan,
    onSecondary = Color.Black,
    tertiary = ApplePurple,
    background = SpaceDarkBg,
    onBackground = TextPrimaryDark,
    surface = SpaceCardBgDark,
    onSurface = TextPrimaryDark,
    surfaceVariant = SpaceCardElevatedDark,
    onSurfaceVariant = TextSecondaryDark,
    outline = BorderDark
)

private val LightColorScheme = lightColorScheme(
    primary = AppleBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE8F1FC),
    onPrimaryContainer = AppleBlue,
    secondary = AppleTeal,
    onSecondary = Color.White,
    tertiary = ApplePurple,
    background = SpaceLightBg,
    onBackground = TextPrimaryLight,
    surface = SpaceCardBgLight,
    onSurface = TextPrimaryLight,
    surfaceVariant = SpaceCardElevatedLight,
    onSurfaceVariant = TextSecondaryLight,
    outline = BorderLight
)

@Composable
fun SpaceHubTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = SpaceTypography,
        content = content
    )
}
