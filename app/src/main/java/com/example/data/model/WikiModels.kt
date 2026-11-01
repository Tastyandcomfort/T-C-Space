package com.example.data.model

data class WikiSummary(
    val title: String,
    val displayTitle: String,
    val extract: String,
    val description: String?,
    val thumbnailUrl: String?,
    val pageUrl: String
)
