import type { MatchSummary } from "./sources/espn-summary";

/**
 * Kurze Live-Infos zu den kroatischen Spielern in laufenden Spielen.
 *
 * Alles wird regelbasiert aus echten ESPN-Spielberichtsdaten abgeleitet (Tore, Vorlagen,
 * Karten, Wechsel, Torschüsse, Paraden; NBA-Boxscore). Es gibt keine Bewertungen/Noten
 * (dafür gibt es keine freie Quelle): "stark" erscheint nur, wenn Zahlen es belegen.
 * Die Texte (DE/HR strikt getrennt) stehen in live-bar-i18n.ts – hier nur Fakten + Code.
 */

export type InfoKind =
  | "goalAssist" // Tor(e) und Vorlage(n)
  | "goal"
  | "assist"
  | "red"
  | "owngoal"
  | "penmiss"
  | "saves"
  | "shots"
  | "yellow"
  | "subOut"
  | "subIn"
  | "nba"
  | "fouls"
  | "start"
  | "bench";

export type InfoTone = "good" | "warn" | "info";

export interface PlayerInfo {
  kind: InfoKind;
  /** Kurznamen; nur bei "start"/"bench" mehrere */
  names: string[];
  /** Minuten, z. B. ["34'"] */
  minutes?: string[];
  /** Zahlen je nach Art: goal/assist/saves/shots/fouls: n; goalAssist: a=Tore, b=Vorlagen; nba: a=Pkt, b=Reb, c=Ast */
  n?: number;
  a?: number;
  b?: number;
  c?: number;
  /** nba: 0 = neutral, 1 = stark, 2 = Double-Double, 3 = Triple-Double */
  level?: 0 | 1 | 2 | 3;
  tone: InfoTone;
  prio: number;
}

/** Schwellen – bewusst streng, damit "stark" nur bei klarer Zahlenlage kommt. */
export const THRESHOLDS = {
  saves: 4, // Torwart: ab 4 Paraden
  shotsOnTarget: 3, // Feldspieler: ab 3 Schüssen aufs Tor
  nbaPoints: 20, // "stark": ab 20 Punkten (oder Double-Double)
  nbaMinLine: 4, // Statline erst, wenn Pkt/Reb/Ast >= 4 (sonst bloß Startelf)
  nbaFouls: 5,
  maxInfos: 6,
} as const;

/* ---------- Fußball ---------- */

export interface SoccerCroat {
  /** Anzeigename (Kurzname) */
  name: string;
}

/**
 * Infos für Spieler beider Seiten aus dem ESPN-Spielbericht.
 * @param croats ESPN-Athleten-ID → Kurzname. null = alle Spieler der Seiten `teamIds` (Nationalmannschaft).
 * @param nameOf Namens-Fallback für `croats === null`
 */
export function soccerInfos(
  s: MatchSummary,
  teamIds: string[],
  croats: Map<string, string> | null,
  nameOf: (id: string, display: string) => string = (_i, d) => d
): PlayerInfo[] {
  const out: PlayerInfo[] = [];
  const starters: string[] = [];
  const bench: string[] = [];
  for (const teamId of teamIds) {
    for (const p of s.rosters[teamId] ?? []) {
      const name = croats ? croats.get(p.id) : nameOf(p.id, p.name);
      if (!name) continue;
      const mine = (k: string, idx: number) => s.events.filter((e) => e.kind === k && e.athleteIds[idx] === p.id);
      const goalEvs = [...mine("goal", 0), ...mine("penalty", 0)].sort((x, y) => (x.base ?? 0) - (y.base ?? 0));
      const goals = Math.max(p.stats.totalGoals ?? 0, goalEvs.length);
      const assists = Math.max(
        p.stats.goalAssists ?? 0,
        s.events.filter((e) => (e.kind === "goal" || e.kind === "penalty") && e.athleteIds[1] === p.id).length
      );
      const red = mine("red", 0)[0];
      const yellows = mine("yellow", 0);
      const own = mine("owngoal", 0);
      const penmiss = mine("penmiss", 0);
      const subIn = mine("sub", 0)[0];
      const subOut = mine("sub", 1)[0];
      const saves = p.stats.saves ?? 0;
      const sot = p.stats.shotsOnTarget ?? 0;
      const played = p.starter || p.subbedIn || Boolean(subIn);
      const mk = (i: Omit<PlayerInfo, "names">): PlayerInfo => ({ names: [name], ...i });

      const cands: PlayerInfo[] = [];
      if (goals >= 1 && assists >= 1)
        cands.push(mk({ kind: "goalAssist", a: goals, b: assists, minutes: goalEvs.map((e) => e.minute), tone: "good", prio: 110 }));
      else if (goals >= 1)
        cands.push(mk({ kind: "goal", n: goals, minutes: goalEvs.map((e) => e.minute), tone: "good", prio: 100 }));
      else if (assists >= 1) cands.push(mk({ kind: "assist", n: assists, tone: "good", prio: 90 }));
      if (red) cands.push(mk({ kind: "red", minutes: [red.minute], tone: "warn", prio: 105 }));
      else if (p.stats.redCards && p.stats.redCards > 0) cands.push(mk({ kind: "red", minutes: [], tone: "warn", prio: 105 }));
      if (own.length) cands.push(mk({ kind: "owngoal", minutes: [own[0].minute], tone: "warn", prio: 95 }));
      if (penmiss.length) cands.push(mk({ kind: "penmiss", minutes: [penmiss[0].minute], tone: "warn", prio: 85 }));
      if (saves >= THRESHOLDS.saves) cands.push(mk({ kind: "saves", n: saves, tone: "good", prio: 80 }));
      else if (sot >= THRESHOLDS.shotsOnTarget && saves === 0)
        cands.push(mk({ kind: "shots", n: sot, tone: "good", prio: 60 }));
      if (yellows.length) cands.push(mk({ kind: "yellow", minutes: [yellows[0].minute], tone: "warn", prio: 70 }));
      if (subOut) cands.push(mk({ kind: "subOut", minutes: [subOut.minute], tone: "info", prio: 35 }));
      else if (subIn) cands.push(mk({ kind: "subIn", minutes: [subIn.minute], tone: "info", prio: 40 }));

      cands.sort((a, b) => b.prio - a.prio);
      if (cands.length) out.push(cands[0]);
      else if (played && p.starter && !p.subbedOut) starters.push(name);
      else if (!p.starter && !played) bench.push(name);
    }
  }
  if (starters.length) out.push({ kind: "start", names: starters, tone: "info", prio: 10 });
  if (bench.length) out.push({ kind: "bench", names: bench, tone: "info", prio: 5 });
  return rank(out);
}

/* ---------- NBA ---------- */

interface RawNbaBox {
  boxscore?: {
    players?: Array<{
      statistics?: Array<{
        keys?: string[];
        athletes?: Array<{
          active?: boolean;
          athlete?: { id?: string };
          starter?: boolean;
          didNotPlay?: boolean;
          stats?: string[];
        }>;
      }>;
    }>;
  };
}

/** NBA-Boxscore → Infos für die getrackten Kroaten (ESPN-Athleten-ID → Kurzname). */
export function nbaInfos(json: RawNbaBox, croats: Map<string, string>): PlayerInfo[] {
  const out: PlayerInfo[] = [];
  const starters: string[] = [];
  const bench: string[] = [];
  for (const t of json.boxscore?.players ?? []) {
    for (const st of t.statistics ?? []) {
      const keys = st.keys ?? [];
      const at = (a: { stats?: string[] }, k: string) => {
        const i = keys.indexOf(k);
        const v = i >= 0 ? Number(a.stats?.[i]) : NaN;
        return Number.isFinite(v) ? v : 0;
      };
      for (const a of st.athletes ?? []) {
        const name = a.athlete?.id ? croats.get(String(a.athlete.id)) : undefined;
        if (!name) continue;
        if (a.active === false) continue; // nicht im Spieltagskader: keine Aussage
        if (a.didNotPlay || !a.stats?.length) {
          if (a.starter) starters.push(name);
          else bench.push(name);
          continue;
        }
        const min = at(a, "minutes");
        const pts = at(a, "points");
        const reb = at(a, "rebounds");
        const ast = at(a, "assists");
        const stl = at(a, "steals");
        const blk = at(a, "blocks");
        const fouls = at(a, "fouls");
        const tens = [pts, reb, ast, stl, blk].filter((v) => v >= 10).length;
        const level = tens >= 3 ? 3 : tens === 2 ? 2 : pts >= THRESHOLDS.nbaPoints ? 1 : 0;
        if (Math.max(pts, reb, ast) >= THRESHOLDS.nbaMinLine || level > 0) {
          out.push({
            kind: "nba",
            names: [name],
            a: pts,
            b: reb,
            c: ast,
            level,
            tone: level > 0 ? "good" : "info",
            prio: level === 3 ? 108 : level === 2 ? 98 : level === 1 ? 88 : 45,
          });
        } else if (min > 0) {
          if (a.starter) starters.push(name);
          else bench.push(name);
        }
        if (fouls >= THRESHOLDS.nbaFouls)
          out.push({ kind: "fouls", names: [name], n: fouls, tone: "warn", prio: 50 });
      }
    }
  }
  if (starters.length) out.push({ kind: "start", names: starters, tone: "info", prio: 10 });
  if (bench.length) out.push({ kind: "bench", names: bench, tone: "info", prio: 5 });
  return rank(out);
}

/** Wichtigstes zuerst, höchstens eine Zeile je Spieler/Gruppe, begrenzt. */
export function rank(list: PlayerInfo[]): PlayerInfo[] {
  const seen = new Set<string>();
  const out: PlayerInfo[] = [];
  for (const i of [...list].sort((a, b) => b.prio - a.prio)) {
    // nur eine Zeile je Spieler (Foulprobleme in der NBA zusätzlich)
    const key = i.kind === "start" || i.kind === "bench" ? i.kind : i.kind === "fouls" ? `${i.names[0]}:fouls` : i.names[0];
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(i);
  }
  return out.slice(0, THRESHOLDS.maxInfos);
}
