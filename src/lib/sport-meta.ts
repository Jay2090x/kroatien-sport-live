/**
 * Kuratierte Listen für "Andere Sportarten".
 * Zuordnung ausschließlich über stabile Quellen-IDs (ESPN / TheSportsDB),
 * nie über Namensähnlichkeit. Tennis: ESPN-Länderkennung "cro".
 */

export type Sport = "football" | "mma" | "boxing" | "tennis" | "basketball" | "handball";

/** Alle Sportarten (Daten) */
export const SPORTS: Sport[] = ["football", "mma", "boxing", "tennis", "basketball", "handball"];

/**
 * Reihenfolge im Filter. MMA und Boxen sind im Filter eine Kategorie
 * „Kampfsport“ (Vertreter: "mma"); beide haben denselben Slug.
 */
export const FILTER_SPORTS: Sport[] = ["football", "mma", "tennis", "basketball", "handball"];

/** Gleiche Filterkategorie? (MMA und Boxen = Kampfsport) */
export function sameCategory(a: Sport | "other", b: Sport): boolean {
  return a !== "other" && SPORT_SLUG[a] === SPORT_SLUG[b];
}

export const SPORT_EMOJI: Record<Sport, string> = {
  football: "⚽",
  mma: "🥋",
  boxing: "🥊",
  tennis: "🎾",
  basketball: "🏀",
  handball: "🤾",
};

export const SPORT_LABEL: Record<Sport, string> = {
  football: "Fußball",
  mma: "MMA",
  boxing: "Boxen",
  tennis: "Tennis",
  basketball: "Basketball",
  handball: "Handball",
};

/** URL-Werte für ?sport= (teilbare Links, in beiden Sprachen gleich) */
export const SPORT_SLUG: Record<Sport, string> = {
  football: "fussball",
  mma: "kampfsport",
  boxing: "kampfsport",
  tennis: "tennis",
  basketball: "basketball",
  handball: "handball",
};

/** Alte Filter-URLs bleiben gültig */
export const LEGACY_SLUGS: Record<string, Sport> = { mma: "mma", boxen: "mma", boks: "mma" };

export function sportFromSlug(slug: string | null | undefined): Sport | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  // alte Links (?sport=mma / ?sport=boxen) → Kampfsport
  if (LEGACY_SLUGS[s]) return LEGACY_SLUGS[s];
  return FILTER_SPORTS.find((k) => SPORT_SLUG[k] === s) ?? null;
}

/**
 * Boxen – kuratiert und manuell gegen mehrere Quellen geprüft (Stand 09.10.2026).
 * Es gibt keine kostenlose Boxen-API ohne Konto (ESPN führt kein Boxen, BoxRec
 * verlangt Login, TheSportsDB-Free-Key liefert nur 15 Events/Saison).
 * Automatik: Ist auf Wikipedia (Kampfrekord-Tabelle) ein NEUERER Kampf eingetragen
 * als hier, wird der Wikipedia-Eintrag angezeigt. Angekündigte Kämpfe nur mit Quelle.
 */
export interface BoxFight {
  /** Kampftag (Ortszeit) "YYYY-MM-DD" */
  date: string;
  opponent: string;
  event: string;
  place: string;
  outcome?: "W" | "L" | "D";
  /** z. B. "TKO", "UD" */
  method?: string;
  round?: string;
  /** Titel o. Ä., je Sprache */
  note?: { de: string; hr: string };
  source: string;
}

export const BOXERS: Array<{
  id: string;
  name: string;
  /** Wikipedia (en) Seitentitel für den Abgleich; leer = nur kuratiert */
  wiki: string;
  division: { de: string; hr: string };
  last: BoxFight | null;
  next: BoxFight | null;
  info?: { de: string; hr: string };
}> = [
  {
    id: "hrgovic",
    name: "Filip Hrgović",
    wiki: "Filip_Hrgović",
    division: { de: "Schwergewicht · IBF-Weltmeister", hr: "teška kategorija · IBF prvak svijeta" },
    last: {
      date: "2026-08-29",
      opponent: "Moses Itauma",
      event: "IBF-WM",
      place: "The O2 Arena, London",
      outcome: "W",
      method: "TKO",
      round: "9",
      note: { de: "IBF-Schwergewichtstitel gewonnen", hr: "osvojio IBF naslov u teškoj kategoriji" },
      source: "Wikipedia, BoxingScene, DNEVNIK.hr",
    },
    next: null,
    info: {
      de: "Pflichtverteidigung gegen Frank Sanchez laut IBF bis 1. März 2027 fällig – Termin und Ort noch nicht offiziell.",
      hr: "Obvezna obrana protiv Franka Sancheza prema IBF-u do 1. ožujka 2027. – datum i mjesto još nisu službeni.",
    },
  },
  {
    id: "plantic",
    name: "Luka Plantić",
    wiki: "Luka_Plantić",
    division: { de: "Supermittelgewicht", hr: "supersrednja kategorija" },
    last: {
      date: "2026-08-29",
      opponent: "Lester Martínez",
      event: "WBC-Interims-WM",
      place: "Los Angeles",
      outcome: "L",
      method: "TKO",
      round: "10",
      note: { de: "Kampf um den WBC-Interimstitel", hr: "borba za privremeni WBC naslov" },
      source: "WBC, Sportnet, Net.hr",
    },
    next: null,
  },
  {
    id: "milun",
    name: "Marko Milun",
    wiki: "Marko_Milun",
    division: { de: "Schwergewicht", hr: "teška kategorija" },
    last: {
      date: "2026-09-19",
      opponent: "Piotr Ćwik",
      event: "Fight Night Zagreb",
      place: "Zagrebački velesajam, Zagreb",
      outcome: "W",
      method: "RTD",
      round: "2",
      source: "Wikipedia, Ferata",
    },
    next: null,
  },
  {
    id: "smakici",
    name: "Agron Smakići",
    wiki: "",
    division: { de: "Schwergewicht", hr: "teška kategorija" },
    last: {
      date: "2026-05-09",
      opponent: "Bakhodir Jalolov",
      event: "Profiboxen",
      place: "Co-op Live, Manchester",
      outcome: "L",
      method: "TKO",
      round: "7",
      source: "BoxingScene, box.live",
    },
    // BKFC Belgrade (17.10.2026, vs. István Bernáth) wurde am 08.10.2026 vom Veranstalter
    // verschoben, neuer Termin offen (Tanjug, Novosti, ArenaFight, UFCalendar; geprüft 19.10.2026).
    next: null,
    info: {
      de: "Der geplante Bare-Knuckle-Kampf gegen István Bernáth (BKFC Belgrade, 17.10.) wurde vom Veranstalter verschoben – neuer Termin noch offen.",
      hr: "Planirana borba golim šakama protiv Istvána Bernátha (BKFC Beograd, 17. 10.) odgođena je – novi datum još nije poznat.",
    },
  },
];

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

/**
 * Stichwörter, die zugleich gewöhnliche (englische/deutsche) Wörter sind ("UFC split with …"):
 * zählen nur großgeschrieben als Ortsname, z. B. "u Splitu", "in Split".
 */
const CITY_ONLY_CAPITALIZED: Record<string, RegExp> = { split: /(^|[^\p{L}])S(plit|PLIT)/u };

/**
 * Kurze Nachnamen, die sonst als Wortanfang fremder Namen treffen (z. B. "lucin" in
 * "Iasmin Lucindo", UFC-Kämpferin aus Brasilien): nur das Wort selbst oder mit
 * kroatischer Fallendung zählt (Lučin, Lučina, Lučinu, Lučinom …).
 */
const WORD_WITH_CASE_ENDING: Record<string, RegExp> = { lucin: / lucin(a|u|om|e)? / };

export function isCroatianHeadline(title: string): boolean {
  const t = ` ${fold(title).replace(/[^a-z0-9]+/g, " ")} `;
  return CROATIAN_HEADLINE_KEYWORDS.some(
    (k) =>
      t.includes(` ${k}`) &&
      (!CITY_ONLY_CAPITALIZED[k] || CITY_ONLY_CAPITALIZED[k].test(title)) &&
      (!WORD_WITH_CASE_ENDING[k] || WORD_WITH_CASE_ENDING[k].test(t))
  );
}
