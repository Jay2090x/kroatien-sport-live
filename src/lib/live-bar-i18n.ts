import type { Lang } from "./i18n";

/** Beschriftungen der LIVE-Leiste – strikt getrennt DE / HR. */
export interface LiveBarLabels {
  live: string;
  region: string;
  next: string;
  halftime: string;
  more: (n: number) => string;
  less: string;
  croats: string;
  oclock: string;
  stand: string;
}

const de: LiveBarLabels = {
  live: "LIVE",
  region: "Laufende Spiele",
  next: "Nächstes Spiel",
  halftime: "Halbzeit",
  more: (n) => `+${n} weitere`,
  less: "weniger",
  croats: "Kroaten",
  oclock: "Uhr",
  stand: "Stand",
};

const hr: LiveBarLabels = {
  live: "UŽIVO",
  region: "Utakmice u tijeku",
  next: "Sljedeća utakmica",
  halftime: "Poluvrijeme",
  more: (n) => `+${n} još`,
  less: "manje",
  croats: "Hrvati",
  oclock: "h",
  stand: "Stanje",
};

export const liveBarLabels = (lang: Lang): LiveBarLabels => (lang === "hr" ? hr : de);
