/**
 * Kuratierte Listen für "Andere Sportarten".
 * Zuordnung ausschließlich über stabile Quellen-IDs (ESPN / TheSportsDB),
 * nie über Namensähnlichkeit. Tennis: ESPN-Länderkennung "cro".
 */

export type Sport = "mma" | "tennis" | "basketball" | "handball";

export const SPORT_EMOJI: Record<Sport, string> = {
  mma: "🥊",
  tennis: "🎾",
  basketball: "🏀",
  handball: "🤾",
};

export const SPORT_LABEL: Record<Sport, string> = {
  mma: "MMA",
  tennis: "Tennis",
  basketball: "Basketball",
  handball: "Handball",
};

/** MMA-Kämpfer (ESPN-Athleten-ID) */
export const MMA_FIGHTERS: Array<{ espnId: string; name: string; org: string }> = [
  { espnId: "4274796", name: "Roberto Soldić", org: "UFC" },
];

/** NBA-Spieler (ESPN-Athleten-ID) */
export const NBA_PLAYERS: Array<{ espnId: string; name: string }> = [
  { espnId: "4017837", name: "Ivica Zubac" },
  { espnId: "4997538", name: "Karlo Matković" },
  { espnId: "2995706", name: "Mario Hezonja" },
];

/**
 * Teams bei TheSportsDB (nur "nächstes Spiel" – siehe README zu Lücken).
 * Kroatische Basketball-Clubs (Premijer liga) bewusst NICHT: TheSportsDB
 * übernimmt dort Heimrecht-Tausch/Verlegungen nicht (geprüft am 08.10.2026
 * gegen den HKS-Spielplan: Samobor – Cibona und Virtus – Zadar falsch).
 */
export const TSDB_TEAMS: Array<{
  id: string;
  name: string;
  sport: Sport;
  national: boolean;
}> = [
  // Handball-Nationalteam bewusst NICHT über TheSportsDB: dort stand am 08.10.2026
  // „Kroatien – Niederlande, 04.11.“, laut EHF ist es Kroatien – Litauen → kuratiert (NT_FIXTURES).
  { id: "140420", name: "Kroatien", sport: "basketball", national: true },
  { id: "141555", name: "RK Zagreb", sport: "handball", national: false },
  { id: "145925", name: "RK Nexe", sport: "handball", national: false },
];

/** Gängige Wettbewerbsnamen (TheSportsDB/ESPN, englisch) → deutsch */
export const COMPETITION_DE: Record<string, string> = {
  "European Mens Handball Championship": "Handball-EM-Qualifikation",
  "World Mens Handball Championship": "Handball-WM",
  "International Friendlies Handball": "Handball-Testspiel",
  "EHF Champions League": "EHF Champions League",
  "EHF European League": "EHF European League",
  "FIBA Basketball World Cup": "Basketball-WM-Qualifikation",
  "Basketball Champions League": "Basketball Champions League",
  "Croatian Premijer Liga": "Premijer liga (Basketball)",
};

/**
 * Große Turniere mit festem Spielplan (manuell geprüft, Quelle verlinkt).
 * Werden nach Turnierende automatisch ausgeblendet. Zeiten = Wiener Zeit.
 */
export const TOURNAMENTS: Array<{
  sport: Sport;
  title: string;
  from: string;
  to: string;
  where: string;
  games: Array<{ start: string; home: string; away: string; note?: string }>;
  source: string;
  url: string;
}> = [
  {
    sport: "handball",
    title: "Handball-WM 2027",
    from: "2027-01-13",
    to: "2027-01-31",
    where: "Deutschland",
    games: [
      { start: "2027-01-14T19:30:00Z", home: "Kroatien", away: "Chile", note: "Gruppe C, München" },
      { start: "2027-01-16T19:30:00Z", home: "Türkei", away: "Kroatien", note: "Gruppe C, München" },
      { start: "2027-01-18T19:30:00Z", home: "Kroatien", away: "Spanien", note: "Gruppe C, München" },
    ],
    source: "IHF-Spielplan (via Wikipedia)",
    url: "https://en.wikipedia.org/wiki/2027_World_Men%27s_Handball_Championship",
  },
];

/**
 * Kuratierte Länderspiele aus offiziellen Spielplänen (manuell geprüft).
 * start = UTC; timeKnown=false → nur Datum anzeigen.
 * Vergangene Termine verschwinden automatisch.
 */
export const NT_FIXTURES: Array<{
  sport: Sport;
  start: string;
  timeKnown: boolean;
  home: string;
  away: string;
  competition: string;
  source: string;
}> = [
  // EHF-Spielplan „European Championship Men 2028 Qualifiers“, Gruppe 1 (statistics.eurohandball.com, Stand 08.10.2026)
  { sport: "handball", start: "2026-11-04T16:00:00Z", timeKnown: true, home: "Kroatien", away: "Litauen", competition: "Handball-EM-Qualifikation · Split", source: "EHF" },
  { sport: "handball", start: "2026-11-07T12:00:00Z", timeKnown: false, home: "Finnland", away: "Kroatien", competition: "Handball-EM-Qualifikation · Vantaa", source: "EHF" },
];

/** HRT-Kategorien (URL-Pfad) für Nicht-Fußball-Schlagzeilen */
export const HRT_SPORT_CATEGORIES: Record<string, Sport | "other"> = {
  kosarka: "basketball",
  rukomet: "handball",
  tenis: "tennis",
  "vise-sportova": "other",
  vaterpolo: "other",
};

/**
 * Schlagzeilen-Filter: nur Titel mit Bezug zu kroatischen Athleten/Teams.
 * Vergleich ohne Diakritika, in Kleinbuchstaben, auf Wortanfang.
 * (Nur für Schlagzeilen – Daten-Zuordnungen laufen weiterhin über IDs.)
 */
export const CROATIAN_HEADLINE_KEYWORDS: string[] = [
  // allgemein
  "hrvat", "vatren", "kauboj", "barakud", "kockast",
  // Klubs
  "cibona", "cedevita", "zadar", "split", "zagreb", "nexe", "podravk", "sesvet", "dubrav", "kvarner",
  "jadran", "mladost", "primorj", "jug ", "solaris", "sibenik", "osijek", "rijek", "dinamo",
  // Tennis
  "cilic", "mektic", "pavic", "vekic", "ruzic", "ciric", "prizmic", "coric", "marcinko", "fett", "dodig",
  // Basketball
  "zubac", "matkovic", "hezonja", "saric", "bogdanovic", "smailagic", "prkacin",
  // Handball / Wasserball
  "duvnjak", "cindric", "martinovic", "sostaric", "mandic", "kuzmanovic", "sigurdsson", "lucin", "srna",
  "vrlic", "fatovic", "lozina", "bukic", "popadic",
  // Kampfsport, Ski, Leichtathletik, weitere
  "soldic", "hrgovic", "ljutic", "zubcic", "perkovic", "cvjetko", "jurisic",
  "sinkovic",
];

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

export function isCroatianHeadline(title: string): boolean {
  const t = ` ${fold(title).replace(/[^a-z0-9]+/g, " ")} `;
  return CROATIAN_HEADLINE_KEYWORDS.some((k) => t.includes(` ${k}`));
}
