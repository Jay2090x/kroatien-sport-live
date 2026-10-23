import type { Lang } from "./i18n";
import type { PlayerInfo } from "./live-player-info";

/** Beschriftungen der LIVE-Leiste – strikt getrennt DE / HR. */
export interface LiveBarLabels {
  live: string;
  region: string;
  next: string;
  halftime: string;
  more: (n: number) => string;
  moreInfo: (n: number) => string;
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
  moreInfo: (n) => `+${n} Infos`,
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
  moreInfo: (n) => `+${n} info`,
  less: "manje",
  croats: "Hrvati",
  oclock: "h",
  stand: "Stanje",
};

export const liveBarLabels = (lang: Lang): LiveBarLabels => (lang === "hr" ? hr : de);

/* ---------- Spieler-Infos (Texte strikt getrennt DE / HR) ---------- */

const min = (m: string) => m.replace(/'/g, "");
const list = (ms: string[] | undefined) => (ms ?? []).map(min).join(", ");

interface InfoTexts {
  goalAssist: (g: number, a: number) => string;
  goal: (n: number, ms: string[]) => string;
  assist: (n: number) => string;
  red: (ms: string[]) => string;
  owngoal: (ms: string[]) => string;
  penmiss: (ms: string[]) => string;
  saves: (n: number) => string;
  shots: (n: number) => string;
  yellow: (ms: string[]) => string;
  subOut: (ms: string[]) => string;
  subIn: (ms: string[]) => string;
  nba: (pts: number, reb: number, ast: number, level: number) => string;
  fouls: (n: number) => string;
  start: string;
  bench: string;
}

const nbaLine = (pts: number, reb: number, ast: number, p: string, r: string, a: string) =>
  [`${pts} ${p}`, reb > 0 ? `${reb} ${r}` : "", ast > 0 ? `${ast} ${a}` : ""].filter(Boolean).join(", ");

const infoDe: InfoTexts = {
  goalAssist: (g, a) => `${g === 1 ? "Tor" : `${g} Tore`} und ${a === 1 ? "Vorlage" : `${a} Vorlagen`} – starker Auftritt`,
  goal: (n, ms) =>
    n === 1 ? `Tor in der ${min(ms[0] ?? "")}. Minute` : `${n >= 3 ? "Hattrick" : `${n} Tore`} (${list(ms).replace(/(\d+(?:\+\d+)?)/g, "$1.")} Minute)`,
  assist: (n) => (n === 1 ? "Torvorlage" : `${n} Torvorlagen`),
  red: (ms) => (ms[0] ? `Rote Karte (${min(ms[0])}. Minute)` : "Rote Karte"),
  owngoal: (ms) => `Eigentor (${min(ms[0] ?? "")}. Minute)`,
  penmiss: (ms) => `Elfmeter vergeben (${min(ms[0] ?? "")}. Minute)`,
  saves: (n) => `hält stark: ${n} Paraden`,
  shots: (n) => `${n} Schüsse aufs Tor`,
  yellow: (ms) => `Gelbe Karte (${min(ms[0] ?? "")}. Minute)`,
  subOut: (ms) => `ausgewechselt (${min(ms[0] ?? "")}. Minute)`,
  subIn: (ms) => `eingewechselt (${min(ms[0] ?? "")}. Minute)`,
  nba: (p, r, a, l) =>
    `${l === 3 ? "Triple-Double: " : l === 2 ? "Double-Double: " : l === 1 ? "stark: " : ""}${nbaLine(p, r, a, "Pkt", "Reb", "Ast")}`,
  fouls: (n) => `${n} Fouls – Foulprobleme`,
  start: "in der Startelf",
  bench: "auf der Bank",
};

const infoHr: InfoTexts = {
  goalAssist: (g, a) => `${g === 1 ? "gol" : `${g} gola`} i ${a === 1 ? "asistencija" : `${a} asistencije`} – odlična izvedba`,
  goal: (n, ms) =>
    n === 1 ? `gol u ${min(ms[0] ?? "")}. minuti` : `${n >= 3 ? "hat-trick" : `${n} gola`} (${list(ms).replace(/(\d+(?:\+\d+)?)/g, "$1.")} minuta)`,
  assist: (n) => (n === 1 ? "asistencija" : `${n} asistencije`),
  red: (ms) => (ms[0] ? `crveni karton (${min(ms[0])}. minuta)` : "crveni karton"),
  owngoal: (ms) => `autogol (${min(ms[0] ?? "")}. minuta)`,
  penmiss: (ms) => `promašen jedanaesterac (${min(ms[0] ?? "")}. minuta)`,
  saves: (n) => `odlično brani: ${n} obrana`,
  shots: (n) => `${n} udarca u okvir`,
  yellow: (ms) => `žuti karton (${min(ms[0] ?? "")}. minuta)`,
  subOut: (ms) => `zamijenjen (${min(ms[0] ?? "")}. minuta)`,
  subIn: (ms) => `ušao u igru (${min(ms[0] ?? "")}. minuta)`,
  nba: (p, r, a, l) =>
    `${l === 3 ? "triple-double: " : l === 2 ? "double-double: " : l === 1 ? "odlično: " : ""}${nbaLine(p, r, a, "koševa", "skokova", "asistencija")}`,
  fouls: (n) => `${n} prekršaja – problemi s prekršajima`,
  start: "u početnoj postavi",
  bench: "na klupi",
};

/** Eine fertige, kurze Zeile ("Sučić: Tor in der 34. Minute"). */
export function playerInfoText(lang: Lang, i: PlayerInfo): string {
  const T = lang === "hr" ? infoHr : infoDe;
  const body = (() => {
    switch (i.kind) {
      case "goalAssist":
        return T.goalAssist(i.a ?? 1, i.b ?? 1);
      case "goal":
        return T.goal(i.n ?? 1, i.minutes ?? []);
      case "assist":
        return T.assist(i.n ?? 1);
      case "red":
        return T.red(i.minutes ?? []);
      case "owngoal":
        return T.owngoal(i.minutes ?? []);
      case "penmiss":
        return T.penmiss(i.minutes ?? []);
      case "saves":
        return T.saves(i.n ?? 0);
      case "shots":
        return T.shots(i.n ?? 0);
      case "yellow":
        return T.yellow(i.minutes ?? []);
      case "subOut":
        return T.subOut(i.minutes ?? []);
      case "subIn":
        return T.subIn(i.minutes ?? []);
      case "nba":
        return T.nba(i.a ?? 0, i.b ?? 0, i.c ?? 0, i.level ?? 0);
      case "fouls":
        return T.fouls(i.n ?? 0);
      case "start":
        return T.start;
      case "bench":
        return T.bench;
    }
  })();
  return `${i.names.join(", ")}: ${body}`;
}
