import type { LeagueId, TvChannel } from "@/types";

export const SITE = {
  name: "Kroatien Sport Live",
  shortName: "KSL",
  description:
    "Redaktionelle Hinweise zu Spielen kroatischer Fußballspieler, Nationalteam und offiziellen TV-Anbietern – ohne Streaming-Hosting.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://kroatien-sport-live.vercel.app",
  locale: "de",
  /** Kontakt nur per E-Mail – keine personenbezogenen Daten im Impressum-Text */
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "kontakt@kroatien-sport-live.app",
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
 * Offizielle TV-/Mediathek-Anbieter (Launch: keine Paid-Giganten Sky/DAZN, kein VPN).
 * Nur öffentliche Links zu Anbieter-Homepages – wir hosten nichts.
 */
export const TV_CHANNELS: TvChannel[] = [
  {
    id: "hrt",
    name: "HRT – Hrvatska radiotelevizija",
    type: "free",
    url: "https://hrt.hr",
    region: "HR",
    markets: ["HR"],
  },
  {
    id: "hrt2",
    name: "HRT 2",
    type: "free",
    url: "https://hrt.hr/hrt-2",
    region: "HR",
    markets: ["HR"],
  },
  {
    id: "sportklub",
    name: "Sport Klub",
    type: "paid",
    url: "https://www.sportklub.hr",
    region: "HR",
    markets: ["HR"],
  },
  {
    id: "arena-sport",
    name: "Arena Sport",
    type: "paid",
    url: "https://www.arenasport.tv",
    region: "HR/BA/RS",
    markets: ["HR", "BA", "RS", "SI", "ME"],
  },
  {
    id: "maxsport",
    name: "MAX Sport",
    type: "paid",
    url: "https://www.maxsport.bg",
    region: "BG/Balkan",
    markets: ["BG"],
  },
];

/** IDs die im Legal-Launch-Modus nie angezeigt werden */
export const BLOCKED_TV_IDS = new Set([
  "sky-de",
  "dazn",
  "viaplay",
  "sky",
  "sky-sport",
]);

export function isAllowedTvChannel(idOrName: string): boolean {
  const s = idOrName.toLowerCase();
  if (BLOCKED_TV_IDS.has(s)) return false;
  if (/sky|dazn|viaplay|nordvpn|expressvpn|surfshark|vpn/i.test(s)) return false;
  return true;
}

/**
 * Rechtlicher Hinweis – ohne Affiliate, ohne VPN, ohne Garantie für Senderechte.
 */
export const LEGAL_DISCLAIMER =
  "Kroatien Sport Live ist ein redaktionelles Informationsangebot. " +
  "Wir hosten keine Übertragungen und bieten keine illegalen Streams an. " +
  "Externe Links führen zu offiziellen Websites Dritter; für deren Inhalte und Verfügbarkeit sind allein die jeweiligen Anbieter verantwortlich. " +
  "Angaben zu Sendern und Sendegebieten sind unverbindliche Hinweise ohne Gewähr und können sich jederzeit ändern. " +
  "Bitte prüfe die Verfügbarkeit und die Nutzungsbedingungen beim jeweiligen Anbieter in deiner Region.";

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
