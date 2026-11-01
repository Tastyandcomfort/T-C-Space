package com.example.util

enum class AppLanguage(val code: String, val displayName: String) {
    ENGLISH("en", "English"),
    SPANISH("es", "Español"),
    FRENCH("fr", "Français"),
    GERMAN("de", "Deutsch"),
    JAPANESE("ja", "日本語"),
    HINDI("hi", "हिन्दी"),
    CHINESE("zh", "中文")
}

enum class AppearanceMode(val label: String) {
    SYSTEM("System"),
    DARK("Dark"),
    LIGHT("Light")
}

object StringsHelper {
    fun getString(key: String, lang: AppLanguage): String {
        return when (lang) {
            AppLanguage.SPANISH -> spanishMap[key] ?: englishMap[key] ?: key
            AppLanguage.FRENCH -> frenchMap[key] ?: englishMap[key] ?: key
            AppLanguage.GERMAN -> germanMap[key] ?: englishMap[key] ?: key
            AppLanguage.JAPANESE -> japaneseMap[key] ?: englishMap[key] ?: key
            AppLanguage.HINDI -> hindiMap[key] ?: englishMap[key] ?: key
            AppLanguage.CHINESE -> chineseMap[key] ?: englishMap[key] ?: key
            AppLanguage.ENGLISH -> englishMap[key] ?: key
        }
    }

    private val englishMap = mapOf(
        "nav_overview" to "Overview",
        "nav_map" to "Map",
        "nav_satellites" to "Satellites",
        "nav_launches" to "Rockets",
        "nav_weather" to "Solar",
        "nav_earth" to "Earth",
        "nav_wiki" to "Wiki Intel",
        "mission_control" to "MISSION CONTROL",
        "systems_ready" to "LIVE SYSTEMS READY",
        "altitude" to "ALTITUDE",
        "velocity" to "VELOCITY",
        "latitude" to "LATITUDE",
        "longitude" to "LONGITUDE",
        "upcoming_launch" to "UPCOMING LAUNCH",
        "space_weather" to "SPACE WEATHER",
        "earth_monitoring" to "EARTH MONITORING",
        "settings" to "Settings",
        "appearance" to "Appearance",
        "language" to "Language",
        "push_alerts" to "Push Notifications & Alerts",
        "test_notification" to "Trigger Test Notification",
        "alert_iss" to "ISS Overhead Pass Alerts",
        "alert_solar" to "Severe Solar Storm Alerts (Kp 5+)",
        "alert_launches" to "Rocket Launch Countdown Alerts",
        "alert_earthquake" to "Major Earthquake Alerts (M 5.0+)"
    )

    private val spanishMap = mapOf(
        "nav_overview" to "Inicio",
        "nav_map" to "Mapa",
        "nav_satellites" to "Satélites",
        "nav_launches" to "Cohetes",
        "nav_weather" to "Solar",
        "nav_earth" to "Tierra",
        "nav_wiki" to "Wiki Intel",
        "mission_control" to "CONTROL DE MISIÓN",
        "systems_ready" to "SISTEMAS OPERATIVOS",
        "altitude" to "ALTITUD",
        "velocity" to "VELOCIDAD",
        "latitude" to "LATITUD",
        "longitude" to "LONGITUD",
        "upcoming_launch" to "PRÓXIMO LANZAMIENTO",
        "space_weather" to "CLIMA ESPACIAL",
        "earth_monitoring" to "MONITOREO TERRESTRE",
        "settings" to "Ajustes",
        "appearance" to "Apariencia",
        "language" to "Idioma",
        "push_alerts" to "Notificaciones y Alertas",
        "test_notification" to "Probar Notificación",
        "alert_iss" to "Paso de la ISS sobre su área",
        "alert_solar" to "Tormentas solares severas (Kp 5+)",
        "alert_launches" to "Cuenta regresiva de lanzamientos",
        "alert_earthquake" to "Terremotos mayores (M 5.0+)"
    )

    private val frenchMap = mapOf(
        "nav_overview" to "Aperçu",
        "nav_map" to "Carte",
        "nav_satellites" to "Satellites",
        "nav_launches" to "Fusées",
        "nav_weather" to "Solaire",
        "nav_earth" to "Terre",
        "nav_wiki" to "Wiki Intel",
        "mission_control" to "CONTRÔLE DE MISSION",
        "systems_ready" to "SYSTÈMES OPÉRATIONNELS",
        "altitude" to "ALTITUDE",
        "velocity" to "VITESSE",
        "latitude" to "LATITUDE",
        "longitude" to "LONGITUDE",
        "upcoming_launch" to "PROCHAIN LANCEMENT",
        "space_weather" to "MÉTÉO SPATIALE",
        "earth_monitoring" to "SURVEILLANCE TERRESTRE",
        "settings" to "Paramètres",
        "appearance" to "Apparence",
        "language" to "Langue",
        "push_alerts" to "Notifications & Alertes",
        "test_notification" to "Tester la notification",
        "alert_iss" to "Alertes passage ISS",
        "alert_solar" to "Tempêtes solaires sévères (Kp 5+)",
        "alert_launches" to "Compte à rebours lancements",
        "alert_earthquake" to "Séismes majeurs (M 5.0+)"
    )

    private val germanMap = mapOf(
        "nav_overview" to "Übersicht",
        "nav_map" to "Karte",
        "nav_satellites" to "Satelliten",
        "nav_launches" to "Raketen",
        "nav_weather" to "Sonne",
        "nav_earth" to "Erde",
        "nav_wiki" to "Wiki Intel",
        "mission_control" to "MISSIONSKONTROLLE",
        "systems_ready" to "SYSTEME BEREIT",
        "altitude" to "HÖHE",
        "velocity" to "GESCHWINDIGKEIT",
        "latitude" to "BREITENGRAD",
        "longitude" to "LÄNGENGRAD",
        "upcoming_launch" to "NÄCHSTER START",
        "space_weather" to "WELTRAUMWETTER",
        "earth_monitoring" to "ERDBEOBACHTUNG",
        "settings" to "Einstellungen",
        "appearance" to "Erscheinungsbild",
        "language" to "Sprache",
        "push_alerts" to "Benachrichtigungen & Alarme",
        "test_notification" to "Testbenachrichtigung auslösen",
        "alert_iss" to "ISS-Überflugalarme",
        "alert_solar" to "Schwere Sonnenstürme (Kp 5+)",
        "alert_launches" to "Raketenstart-Countdowns",
        "alert_earthquake" to "Schwere Erdbeben (M 5.0+)"
    )

    private val japaneseMap = mapOf(
        "nav_overview" to "概要",
        "nav_map" to "マップ",
        "nav_satellites" to "衛星",
        "nav_launches" to "ロケット",
        "nav_weather" to "太陽気象",
        "nav_earth" to "地球監視",
        "nav_wiki" to "Wiki情報",
        "mission_control" to "ミッションコントロール",
        "systems_ready" to "全システム正常稼働中",
        "altitude" to "高度",
        "velocity" to "速度",
        "latitude" to "緯度",
        "longitude" to "経度",
        "upcoming_launch" to "次回打ち上げ",
        "space_weather" to "宇宙天気",
        "earth_monitoring" to "地球環境監視",
        "settings" to "設定",
        "appearance" to "外観モード",
        "language" to "言語",
        "push_alerts" to "プッシュ通知とアラート",
        "test_notification" to "テスト通知を送信",
        "alert_iss" to "ISS通過通知",
        "alert_solar" to "太陽嵐警報 (Kp 5以上)",
        "alert_launches" to "ロケット打ち上げカウントダウン",
        "alert_earthquake" to "大規模地震アラート (M 5.0以上)"
    )

    private val hindiMap = mapOf(
        "nav_overview" to "अवलोकन",
        "nav_map" to "नक्शा",
        "nav_satellites" to "उपग्रह",
        "nav_launches" to "रॉकेट",
        "nav_weather" to "सौर मौसम",
        "nav_earth" to "पृथ्वी",
        "nav_wiki" to "विकी ज्ञान",
        "mission_control" to "मिशन नियंत्रण",
        "systems_ready" to "प्रणालियाँ तैयार",
        "altitude" to "ऊंचाई",
        "velocity" to "गति",
        "latitude" to "अक्षांश",
        "longitude" to "देशांतर",
        "upcoming_launch" to "आगामी प्रक्षेपण",
        "space_weather" to "अंतरिक्ष मौसम",
        "earth_monitoring" to "पृथ्वी निगरानी",
        "settings" to "सेटिंग्स",
        "appearance" to "स्वरूप",
        "language" to "भाषा",
        "push_alerts" to "पुश सूचनाएं और अलर्ट",
        "test_notification" to "परीक्षण सूचना भेजें",
        "alert_iss" to "आईएसएस फ्लाईबाई अलर्ट",
        "alert_solar" to "तीव्र सौर तूफान अलर्ट (Kp 5+)",
        "alert_launches" to "रॉकेट प्रक्षेपण अलर्ट",
        "alert_earthquake" to "भूकंप अलर्ट (M 5.0+)"
    )

    private val chineseMap = mapOf(
        "nav_overview" to "总览",
        "nav_map" to "地图",
        "nav_satellites" to "卫星",
        "nav_launches" to "火箭发射",
        "nav_weather" to "空间天气",
        "nav_earth" to "地球监测",
        "nav_wiki" to "百科情报",
        "mission_control" to "任务指挥中心",
        "systems_ready" to "系统就绪",
        "altitude" to "轨道高度",
        "velocity" to "轨道速度",
        "latitude" to "纬度",
        "longitude" to "经度",
        "upcoming_launch" to "即将发射",
        "space_weather" to "空间天气",
        "earth_monitoring" to "全球地球监测",
        "settings" to "系统设置",
        "appearance" to "外观主题",
        "language" to "语言选择",
        "push_alerts" to "推送通知与预警",
        "test_notification" to "触发测试通知",
        "alert_iss" to "空间站过境提醒",
        "alert_solar" to "强地磁暴预警 (Kp 5+)",
        "alert_launches" to "火箭发射倒计时",
        "alert_earthquake" to "重大地震预警 (M 5.0+)"
    )
}
