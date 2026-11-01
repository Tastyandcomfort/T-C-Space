package com.example.util

data class MapPolyline(
    val points: List<Pair<Double, Double>> // Pair(lat, lon)
)

object WorldMapGeometry {
    // Simplified coastline outlines of world continents for crisp vector Canvas rendering
    val CONTINENT_OUTLINES: List<MapPolyline> by lazy {
        listOf(
            // North America
            MapPolyline(
                listOf(
                    Pair(71.0, -156.0), Pair(69.0, -141.0), Pair(68.0, -135.0), Pair(70.0, -128.0),
                    Pair(69.0, -114.0), Pair(68.0, -97.0), Pair(63.0, -90.0), Pair(58.0, -94.0),
                    Pair(51.0, -80.0), Pair(55.0, -77.0), Pair(62.0, -77.0), Pair(60.0, -64.0),
                    Pair(54.0, -56.0), Pair(47.0, -53.0), Pair(43.0, -65.0), Pair(41.0, -70.0),
                    Pair(35.0, -75.0), Pair(25.0, -80.0), Pair(30.0, -84.0), Pair(29.0, -95.0),
                    Pair(26.0, -97.0), Pair(21.0, -97.0), Pair(18.0, -92.0), Pair(21.0, -87.0),
                    Pair(16.0, -88.0), Pair(15.0, -83.0), Pair(9.0, -79.0), Pair(8.0, -83.0),
                    Pair(14.0, -92.0), Pair(16.0, -98.0), Pair(23.0, -106.0), Pair(32.0, -117.0),
                    Pair(38.0, -123.0), Pair(48.0, -124.0), Pair(54.0, -130.0), Pair(59.0, -140.0),
                    Pair(60.0, -150.0), Pair(55.0, -163.0), Pair(59.0, -165.0), Pair(65.0, -168.0),
                    Pair(71.0, -156.0)
                )
            ),
            // South America
            MapPolyline(
                listOf(
                    Pair(12.0, -72.0), Pair(10.0, -62.0), Pair(6.0, -55.0), Pair(0.0, -50.0),
                    Pair(-3.0, -40.0), Pair(-5.0, -35.0), Pair(-13.0, -38.0), Pair(-23.0, -43.0),
                    Pair(-34.0, -53.0), Pair(-41.0, -62.0), Pair(-52.0, -68.0), Pair(-55.0, -66.0),
                    Pair(-53.0, -74.0), Pair(-46.0, -75.0), Pair(-37.0, -73.0), Pair(-23.0, -70.0),
                    Pair(-14.0, -76.0), Pair(-4.0, -81.0), Pair(1.0, -79.0), Pair(8.0, -77.0),
                    Pair(12.0, -72.0)
                )
            ),
            // Europe
            MapPolyline(
                listOf(
                    Pair(36.0, -5.0), Pair(43.0, -9.0), Pair(43.0, -1.0), Pair(47.0, -3.0),
                    Pair(49.0, 1.0), Pair(51.0, 2.0), Pair(54.0, 8.0), Pair(58.0, 6.0),
                    Pair(62.0, 5.0), Pair(71.0, 26.0), Pair(68.0, 43.0), Pair(64.0, 40.0),
                    Pair(60.0, 30.0), Pair(54.0, 20.0), Pair(45.0, 14.0), Pair(41.0, 15.0),
                    Pair(38.0, 24.0), Pair(36.0, 22.0), Pair(40.0, 18.0), Pair(38.0, 15.0),
                    Pair(38.0, -0.0), Pair(36.0, -5.0)
                )
            ),
            // Africa
            MapPolyline(
                listOf(
                    Pair(36.0, -5.0), Pair(37.0, 10.0), Pair(32.0, 20.0), Pair(31.0, 32.0),
                    Pair(22.0, 37.0), Pair(12.0, 44.0), Pair(11.0, 51.0), Pair(-4.0, 40.0),
                    Pair(-12.0, 40.0), Pair(-26.0, 33.0), Pair(-34.0, 26.0), Pair(-34.0, 18.0),
                    Pair(-22.0, 14.0), Pair(-12.0, 13.0), Pair(4.0, 9.0), Pair(5.0, 1.0),
                    Pair(4.0, -7.0), Pair(12.0, -17.0), Pair(21.0, -17.0), Pair(32.0, -9.0),
                    Pair(36.0, -5.0)
                )
            ),
            // Asia
            MapPolyline(
                listOf(
                    Pair(70.0, 60.0), Pair(73.0, 80.0), Pair(76.0, 100.0), Pair(77.0, 105.0),
                    Pair(70.0, 135.0), Pair(72.0, 150.0), Pair(66.0, 170.0), Pair(60.0, 165.0),
                    Pair(52.0, 157.0), Pair(46.0, 142.0), Pair(39.0, 126.0), Pair(37.0, 122.0),
                    Pair(30.0, 122.0), Pair(22.0, 114.0), Pair(21.0, 108.0), Pair(10.0, 104.0),
                    Pair(8.0, 98.0), Pair(22.0, 91.0), Pair(15.0, 80.0), Pair(8.0, 77.0),
                    Pair(20.0, 70.0), Pair(25.0, 62.0), Pair(26.0, 56.0), Pair(15.0, 53.0),
                    Pair(12.0, 44.0), Pair(27.0, 35.0), Pair(36.0, 36.0), Pair(41.0, 29.0),
                    Pair(41.0, 44.0), Pair(42.0, 50.0), Pair(50.0, 54.0), Pair(60.0, 60.0),
                    Pair(70.0, 60.0)
                )
            ),
            // Australia
            MapPolyline(
                listOf(
                    Pair(-12.0, 131.0), Pair(-11.0, 142.0), Pair(-22.0, 150.0), Pair(-33.0, 152.0),
                    Pair(-38.0, 147.0), Pair(-37.0, 140.0), Pair(-32.0, 132.0), Pair(-35.0, 116.0),
                    Pair(-22.0, 114.0), Pair(-14.0, 126.0), Pair(-12.0, 131.0)
                )
            ),
            // Greenland
            MapPolyline(
                listOf(
                    Pair(83.0, -30.0), Pair(76.0, -20.0), Pair(65.0, -38.0), Pair(60.0, -44.0),
                    Pair(65.0, -53.0), Pair(75.0, -58.0), Pair(82.0, -60.0), Pair(83.0, -30.0)
                )
            )
        )
    }
}
