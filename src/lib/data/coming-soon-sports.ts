/**
 * Weitere kroatische Sportarten – Coming Soon
 * Später eigene Tracker, Ligen und Live-Feeds anbinden.
 */

export interface ComingSoonSport {
  id: string;
  nameDe: string;
  nameEn: string;
  emoji: string;
  descriptionDe: string;
  descriptionEn: string;
  highlights: string[];
  status: "coming-soon" | "beta";
  /** Farbe für Akzent (Tailwind-ähnliche Token) */
  accent: string;
}

export const COMING_SOON_SPORTS: ComingSoonSport[] = [
  {
    id: "handball",
    nameDe: "Handball",
    nameEn: "Handball",
    emoji: "🤾",
    descriptionDe:
      "Vatreni & Kader der Top-Clubs (Zagreb, Kielce, Barcelona …) – Live-Ergebnisse und EM/WM-Tracker.",
    descriptionEn:
      "National team & top club rosters – live scores and major tournament tracker.",
    highlights: ["Männer & Frauen", "EHF Champions League", "WM / EM"],
    status: "coming-soon",
    accent: "from-orange-500/20 to-amber-600/10",
  },
  {
    id: "basketball",
    nameDe: "Basketball",
    nameEn: "Basketball",
    emoji: "🏀",
    descriptionDe:
      "NBA-Kroaten, ABA-Liga und Nationalteam – Stats, Spiele und Highlight-Clips.",
    descriptionEn:
      "NBA Croatians, ABA League and national team – stats, fixtures and highlights.",
    highlights: ["NBA", "EuroLeague", "ABA Liga"],
    status: "coming-soon",
    accent: "from-orange-600/20 to-red-700/10",
  },
  {
    id: "waterpolo",
    nameDe: "Wasserball",
    nameEn: "Water Polo",
    emoji: "🤽",
    descriptionDe:
      "Weltklasse-Tradition der Vatreni – Ligen, Olympia und Champions League Wasserball.",
    descriptionEn:
      "World-class national tradition – leagues, Olympics and Champions League water polo.",
    highlights: ["Olympia", "Weltliga", "LEN Champions League"],
    status: "coming-soon",
    accent: "from-sky-500/20 to-blue-700/10",
  },
  {
    id: "tennis",
    nameDe: "Tennis",
    nameEn: "Tennis",
    emoji: "🎾",
    descriptionDe:
      "ATP/WTA-Kroaten, Davis Cup und Live-Match-Tracker mit TV-Hinweisen.",
    descriptionEn:
      "ATP/WTA Croatians, Davis Cup and live match tracker with TV tips.",
    highlights: ["ATP / WTA", "Davis Cup", "Grand Slams"],
    status: "coming-soon",
    accent: "from-lime-500/20 to-emerald-700/10",
  },
  {
    id: "athletics",
    nameDe: "Leichtathletik",
    nameEn: "Athletics",
    emoji: "🏃",
    descriptionDe:
      "WM, EM und Diamond League – kroatische Athlet:innen und Rekorde im Überblick.",
    descriptionEn:
      "Worlds, Europeans and Diamond League – Croatian athletes and records.",
    highlights: ["WM / EM", "Diamond League", "Olympia"],
    status: "coming-soon",
    accent: "from-yellow-500/20 to-orange-600/10",
  },
  {
    id: "winter",
    nameDe: "Wintersport",
    nameEn: "Winter Sports",
    emoji: "⛷️",
    descriptionDe:
      "Ski Alpin, Snowboard und mehr – Live-Resultate aus dem Weltcup.",
    descriptionEn:
      "Alpine skiing, snowboard and more – live results from the World Cup.",
    highlights: ["Ski Alpin", "Weltcup", "Olympia"],
    status: "coming-soon",
    accent: "from-cyan-400/20 to-slate-600/10",
  },
];
