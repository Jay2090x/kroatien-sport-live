import type { LeagueId, TvChannel, VpnProvider } from "@/types";

export const SITE = {
  name: "Kroatien Sport Live",
  shortName: "KSL",
  description:
    "Live-Ergebnisse, Spiele und Tracker für kroatische Fußballspieler in Europa – Premier League, Bundesliga, Serie A, HNL und mehr.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://kroatien-sport-live.vercel.app",
  locale: "de",
  twitter: "@KroatienSportLive",
} as const;

export const LEAGUE_LABELS: Record<LeagueId | "all" | "live", string> = {
  all: "Alle",
  live: "Nur Live",
  "premier-league": "Premier League",
  bundesliga: "Bundesliga",
  "serie-a": "Serie A",
  laliga: "La Liga",
  "ligue-1": "Ligue 1",
  hnl: "HNL",
  "nations-league": "Nations League",
  "champions-league": "Champions League",
  "europa-league": "Europa League",
  "conference-league": "Conference League",
  "world-cup": "WM",
  friendly: "Freundschaftsspiel",
  other: "Sonstige",
};

/** Filter-Chips in der Dashboard-Reihenfolge */
export const FILTER_CHIPS: Array<{ id: "all" | "live" | LeagueId; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "live", label: "Nur Live" },
  { id: "premier-league", label: "Premier League" },
  { id: "bundesliga", label: "Bundesliga" },
  { id: "serie-a", label: "Serie A" },
  { id: "hnl", label: "HNL" },
  { id: "nations-league", label: "Nations League" },
];

export const DATE_FILTERS = [
  { id: "today" as const, label: "Heute" },
  { id: "next7" as const, label: "Nächste 7 Tage" },
  { id: "all" as const, label: "Alle" },
];

/**
 * Offizielle / bekannte TV- & Streaming-Anbieter
 * Links sind öffentlich; Affiliate nur bei expliziter Markierung
 */
export const TV_CHANNELS: TvChannel[] = [
  {
    id: "hrt",
    name: "HRT – Hrvatska radiotelevizija",
    type: "free",
    url: "https://hrt.hr",
    region: "HR",
  },
  {
    id: "hrt2",
    name: "HRT 2",
    type: "free",
    url: "https://hrt.hr/hrt-2",
    region: "HR",
  },
  {
    id: "sky-de",
    name: "Sky Sport",
    type: "paid",
    url: "https://www.sky.de/sport",
    region: "DE/AT",
  },
  {
    id: "dazn",
    name: "DAZN",
    type: "streaming",
    url: "https://www.dazn.com/de-DE/home",
    region: "DE/AT/CH",
  },
  {
    id: "sportklub",
    name: "Sport Klub",
    type: "paid",
    url: "https://www.sportklub.hr",
    region: "HR",
  },
  {
    id: "arena-sport",
    name: "Arena Sport",
    type: "paid",
    url: "https://www.arenasport.tv",
    region: "HR/BA/RS",
  },
  {
    id: "maxsport",
    name: "MAX Sport",
    type: "paid",
    url: "https://www.maxsport.bg",
    region: "BG/Balkan",
  },
  {
    id: "viaplay",
    name: "Viaplay",
    type: "streaming",
    url: "https://viaplay.de",
    region: "DE",
  },
];

/**
 * VPN-Empfehlungen – klar als Werbung/Affiliate gekennzeichnet
 * URLs durch echte Affiliate-Links ersetzen, sobald Partnervertrag besteht
 */
export const VPN_PROVIDERS: VpnProvider[] = [
  {
    id: "nordvpn",
    name: "NordVPN",
    url: "https://nordvpn.com",
    description: "Schnell, sicher, viele Server – ideal für Geo-Content und Streaming.",
    isAffiliate: true,
  },
  {
    id: "expressvpn",
    name: "ExpressVPN",
    url: "https://www.expressvpn.com",
    description: "Premium-VPN mit stabilen Streams und einfacher App.",
    isAffiliate: true,
  },
  {
    id: "surfshark",
    name: "Surfshark",
    url: "https://surfshark.com",
    description: "Günstig, unbegrenzte Geräte, gut für Familien/WG.",
    isAffiliate: true,
  },
];

export const LEGAL_DISCLAIMER =
  "Kroatien Sport Live bietet keine illegalen Streams und hostet keine Übertragungen. " +
  "Alle TV- und Streaming-Links führen zu offiziellen Anbietern. " +
  "Rechteinhaber und Sendegebiete können sich ändern – bitte prüfe die Verfügbarkeit in deiner Region. " +
  "VPN-Empfehlungen können Affiliate-Links enthalten; wir erhalten ggf. eine Provision, ohne dass dir Mehrkosten entstehen.";

export const POSITION_LABELS: Record<string, string> = {
  GK: "Torwart",
  CB: "Innenverteidiger",
  LB: "Linker Verteidiger",
  RB: "Rechter Verteidiger",
  LWB: "Linksaußen-Verteidiger",
  RWB: "Rechtsaußen-Verteidiger",
  CDM: "Defensives Mittelfeld",
  CM: "Zentrales Mittelfeld",
  CAM: "Offensives Mittelfeld",
  LM: "Linkes Mittelfeld",
  RM: "Rechtes Mittelfeld",
  LW: "Linksaußen",
  RW: "Rechtsaußen",
  CF: "Hängende Spitze",
  ST: "Stürmer",
};
