/**
 * Weitere kroatische Sportarten – Coming Soon
 * Später eigene Tracker, Ligen und Live-Feeds anbinden.
 */

export interface ComingSoonSport {
  id: string;
  nameDe: string;
  nameEn: string;
  nameHr: string;
  emoji: string;
  descriptionDe: string;
  descriptionEn: string;
  descriptionHr: string;
  highlights: string[];
  status: "coming-soon" | "beta";
  /** Farbe für Akzent (Tailwind-ähnliche Token) */
  accent: string;
}

export function sportName(sport: ComingSoonSport, locale: string): string {
  if (locale === "en") return sport.nameEn;
  if (locale === "hr") return sport.nameHr;
  return sport.nameDe;
}

export function sportDescription(
  sport: ComingSoonSport,
  locale: string
): string {
  if (locale === "en") return sport.descriptionEn;
  if (locale === "hr") return sport.descriptionHr;
  return sport.descriptionDe;
}

export const COMING_SOON_SPORTS: ComingSoonSport[] = [
  {
    id: "handball",
    nameDe: "Handball",
    nameEn: "Handball",
    nameHr: "Rukomet",
    emoji: "🤾",
    descriptionDe:
      "Vatreni & Kader der Top-Clubs (Zagreb, Kielce, Barcelona …) – Live-Ergebnisse und EM/WM-Tracker.",
    descriptionEn:
      "National team & top club rosters – live scores and major tournament tracker.",
    descriptionHr:
      "Reprezentacija i top klubovi (Zagreb, Kielce, Barcelona …) – live rezultati i EM/SP tracker.",
    highlights: ["Männer & Frauen", "EHF Champions League", "WM / EM"],
    status: "coming-soon",
    accent: "from-orange-500/20 to-amber-600/10",
  },
  {
    id: "basketball",
    nameDe: "Basketball",
    nameEn: "Basketball",
    nameHr: "Košarka",
    emoji: "🏀",
    descriptionDe:
      "NBA-Kroaten, ABA-Liga und Nationalteam – Stats, Spiele und Highlight-Clips.",
    descriptionEn:
      "NBA Croatians, ABA League and national team – stats, fixtures and highlights.",
    descriptionHr:
      "NBA Hrvati, ABA liga i reprezentacija – stats, utakmice i highlighti.",
    highlights: ["NBA", "EuroLeague", "ABA Liga"],
    status: "coming-soon",
    accent: "from-orange-600/20 to-red-700/10",
  },
  {
    id: "waterpolo",
    nameDe: "Wasserball",
    nameEn: "Water Polo",
    nameHr: "Vaterpolo",
    emoji: "🤽",
    descriptionDe:
      "Weltklasse-Tradition der Vatreni – Ligen, Olympia und Champions League Wasserball.",
    descriptionEn:
      "World-class national tradition – leagues, Olympics and Champions League water polo.",
    descriptionHr:
      "Svjetska tradicija Vatrenih – lige, Olimpijada i vaterpolo Ligue prvaka.",
    highlights: ["Olympia", "Weltliga", "LEN Champions League"],
    status: "coming-soon",
    accent: "from-sky-500/20 to-blue-700/10",
  },
  {
    id: "tennis",
    nameDe: "Tennis",
    nameEn: "Tennis",
    nameHr: "Tenis",
    emoji: "🎾",
    descriptionDe:
      "ATP/WTA-Kroaten, Davis Cup und Live-Match-Tracker mit TV-Hinweisen.",
    descriptionEn:
      "ATP/WTA Croatians, Davis Cup and live match tracker with TV tips.",
    descriptionHr:
      "ATP/WTA Hrvati, Davis Cup i live tracker s TV savjetima.",
    highlights: ["ATP / WTA", "Davis Cup", "Grand Slams"],
    status: "coming-soon",
    accent: "from-lime-500/20 to-emerald-700/10",
  },
  {
    id: "athletics",
    nameDe: "Leichtathletik",
    nameEn: "Athletics",
    nameHr: "Atletika",
    emoji: "🏃",
    descriptionDe:
      "WM, EM und Diamond League – kroatische Athlet:innen und Rekorde im Überblick.",
    descriptionEn:
      "Worlds, Europeans and Diamond League – Croatian athletes and records.",
    descriptionHr:
      "SP, EP i Diamond League – hrvatski atletičari i rekordi na jednom mjestu.",
    highlights: ["WM / EM", "Diamond League", "Olympia"],
    status: "coming-soon",
    accent: "from-yellow-500/20 to-orange-600/10",
  },
  {
    id: "winter",
    nameDe: "Wintersport",
    nameEn: "Winter Sports",
    nameHr: "Zimski sportovi",
    emoji: "⛷️",
    descriptionDe:
      "Ski Alpin, Snowboard und mehr – Live-Resultate aus dem Weltcup.",
    descriptionEn:
      "Alpine skiing, snowboard and more – live results from the World Cup.",
    descriptionHr:
      "Alpsko skijanje, snowboard i više – live rezultati iz Svjetskog kupa.",
    highlights: ["Ski Alpin", "Weltcup", "Olympia"],
    status: "coming-soon",
    accent: "from-cyan-400/20 to-slate-600/10",
  },
];
