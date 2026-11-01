package com.example.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.ui.SpaceHubViewModel
import com.example.ui.components.*
import com.example.ui.theme.*

@Composable
fun WikiExploreScreen(
    viewModel: SpaceHubViewModel,
    modifier: Modifier = Modifier
) {
    val wikiResult by viewModel.wikiResult.collectAsState()
    val isLoading by viewModel.isWikiLoading.collectAsState()
    val context = LocalContext.current

    var searchQuery by remember { mutableStateOf("International Space Station") }

    LaunchedEffect(Unit) {
        if (wikiResult == null) {
            viewModel.searchWiki("International Space Station")
        }
    }

    val suggestions = listOf(
        "International Space Station",
        "James Webb Space Telescope",
        "Voyager 1",
        "Europa Clipper",
        "Artemis program",
        "Mars 2020",
        "Hubble Space Telescope",
        "Tiangong space station",
        "Starlink"
    )

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .testTag("wiki_explore_screen"),
        contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            AppleCard {
                SectionHeader(
                    eyebrow = "SPACE ENCYCLOPEDIA",
                    title = "Wikipedia Live Intel",
                    subtitle = "Search any spacecraft, planet, mission, asteroid or concept in real-time",
                    badgeText = "WIKIPEDIA REST API"
                )

                Spacer(modifier = Modifier.height(14.dp))

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("wiki_search_input"),
                    placeholder = { Text("Search any mission, planet, or craft...") },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = AppleBlue)
                    },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { searchQuery = "" }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp)
                )

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = { viewModel.searchWiki(searchQuery) },
                    modifier = Modifier.fillMaxWidth().testTag("wiki_search_button"),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AppleBlue)
                ) {
                    Icon(Icons.Default.MenuBook, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Explore Encyclopedia Intel")
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Suggestion chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    suggestions.forEach { item ->
                        Surface(
                            modifier = Modifier
                                .clip(RoundedCornerShape(99.dp))
                                .clickable {
                                    searchQuery = item
                                    viewModel.searchWiki(item)
                                },
                            shape = RoundedCornerShape(99.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Text(
                                text = item,
                                style = MaterialTheme.typography.labelSmall,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                            )
                        }
                    }
                }
            }
        }

        if (isLoading) {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = AppleBlue)
                }
            }
        } else if (wikiResult != null) {
            val article = wikiResult!!
            item {
                AppleCard(modifier = Modifier.testTag("wiki_article_card")) {
                    if (!article.thumbnailUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = article.thumbnailUrl,
                            contentDescription = article.displayTitle,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(14.dp)),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.height(14.dp))
                    }

                    Text(
                        text = article.displayTitle,
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    if (!article.description.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = article.description,
                            style = MaterialTheme.typography.titleMedium,
                            color = AppleBlue,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = article.extract,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurface,
                        lineHeight = 24.sp
                    )

                    Spacer(modifier = Modifier.height(16.dp))
                    Button(
                        onClick = {
                            try {
                                context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(article.pageUrl)))
                            } catch (_: Exception) {}
                        },
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Text("Read Complete Wikipedia Article", color = AppleBlue, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.width(6.dp))
                        Icon(Icons.AutoMirrored.Filled.OpenInNew, contentDescription = null, tint = AppleBlue, modifier = Modifier.size(16.dp))
                    }
                }
            }
        }
    }
}
