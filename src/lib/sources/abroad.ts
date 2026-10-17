import { mapLimit } from "../async";
import { ESPN_TEAM_TO_HNL, PLAYER_NAME, clubDe } from "../players-meta";
import { addDaysYmd, viennaMidnight, viennaWeekday, viennaYmd } from "../time";
import { lineupStatusOf, performanceOf, type Performance } from "./espn-summary";
import { SITE_API, loadEvents } from "./espn";
import {
  adaptive,
  loadClubGames,
  mapClubEvent,
  loadSquadBase,
  type GameRef,
  type NextLineup,
  type SquadBase,
} from "./players";

/**
 * Legionäre-Wochenende und Kroaten im Europacup.
 *
 * Grundlage ist derselbe ESPN-Datenbestand wie auf der Spielerseite:
 * Kroaten = aktueller Nationalkader (Spieltagskader der letzten Länderspielphase),
 * Vereine/Spiele/Einsätze über ESPN-IDs. Nichts wird geschätzt – vor Veröffentlichung
 * der Aufstellung heißt es "noch nicht bekannt".
 */

const H = 3600_000;
const LINEUP_LOOKAHEAD = 2 * H;
const EUROPE_SLUG = /^uefa\.(champions|europa|europa\.conf)(_qual)?$/;

export type PerfNote = "noroster" | "nosummary";

export interface CroInGame {
  id: string;
  name: string;
  club: string | null;
  /** ESPN-Team-ID der Seite, für die der Spieler spielt */
  teamId: string;
  perf: Performance | null;
  perfNote?: PerfNote;
  /** nur vor/während des Spiels: Aufstellungsstatus */
  lineup?: NextLineup;
}

export interface AbroadGame {
  game: GameRef;
  /** Seite(n) mit kroatischer Beteiligung (ESPN-Team-IDs) */
  croSides: string[];
  /** kroatische Vereine in diesem Spiel (HNL-Kurzname) */
  croClubs: string[];
  players: CroInGame[];
  /** Spieltag der Ligaphase (aus dem Vereinsspielplan abgeleitet) */
  matchday?: number;
}

export interface WeekendData {
  from: string;
  to: string;
  current: boolean; // true = laufendes Wochenende, false = kommendes
  games: AbroadGame[];
  idle: Array<{ id: string; name: string; club: string | null }>;
  abroadCount: number;
  fetchedAt: string;
  gaps: string[];
}

export interface EuropeWeek {
  from: string; // Montag 00:00 Wien
  games: AbroadGame[];
}

export interface EuropeData {
  last: EuropeWeek | null;
  next: EuropeWeek | null;
  clubs: Array<{ name: string; competition: string }>;
  fetchedAt: string;
  gaps: string[];
}

function nameOf(b: SquadBase, id: string): string {
  return PLAYER_NAME[id] ?? b.athleteById.get(id)?.name ?? b.squad.get(id) ?? id;
}

function clubOf(b: SquadBase, id: string): string | null {
  const a = b.athleteById.get(id);
  if (!a?.teamId) return null;
  return ESPN_TEAM_TO_HNL[a.teamId] ?? (a.teamName ? clubDe(a.teamName) : null);
}

/** Einsatz bzw. Aufstellungsstatus der Kroaten in einem Spiel. */
async function playersIn(
  b: SquadBase,
  g: GameRef,
  sides: Array<{ teamId: string; ids: string[] }>,
  now: number
): Promise<CroInGame[]> {
  const out: CroInGame[] = [];
  const kick = Date.parse(g.kickoff);
  const needSummary =
    g.state === "post" || g.state === "in" || (g.state === "pre" && kick - now <= LINEUP_LOOKAHEAD);
  const s = needSummary && g.slug ? await b.summary(g.slug, g.id, g.kickoff, g.state === "post") : null;
  for (const side of sides) {
    for (const id of side.ids) {
      const base = { id, name: nameOf(b, id), club: clubOf(b, id), teamId: side.teamId };
      if (g.state === "post" || g.state === "in") {
        if (!s) out.push({ ...base, perf: null, perfNote: "nosummary" });
        else {
          const p = performanceOf(s.data, side.teamId, id);
          if (!p.rosterAvailable) out.push({ ...base, perf: null, perfNote: "noroster" });
          else out.push({ ...base, perf: p, lineup: g.state === "in" ? lineupStatusOf(s.data, side.teamId, id) : undefined });
        }
      } else {
        let lineup: NextLineup = "pending";
        if (needSummary) lineup = s ? lineupStatusOf(s.data, side.teamId, id) : "unknown";
        out.push({ ...base, perf: null, lineup });
      }
    }
  }
  return out;
}

/** Kroaten je ESPN-Team-ID (nur Spieler mit bekanntem Verein). */
function playersByTeam(b: SquadBase, filter: (teamId: string) => boolean): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const id of b.ids) {
    const t = b.athleteById.get(id)?.teamId;
    if (!t || !filter(t)) continue;
    m.set(t, [...(m.get(t) ?? []), id]);
  }
  return m;
}

/** Fr 00:00 bis Di 00:00 (Wiener Zeit); Di–Do zeigt das kommende Wochenende. */
export function weekendWindow(now: number): { from: number; to: number; current: boolean } {
  const ymd = viennaYmd(new Date(now).toISOString());
  const wd = viennaWeekday(now);
  const current = wd === 5 || wd === 6 || wd === 0 || wd === 1;
  const friday = current ? addDaysYmd(ymd, -((wd - 5 + 7) % 7)) : addDaysYmd(ymd, 5 - wd);
  return { from: viennaMidnight(friday), to: viennaMidnight(addDaysYmd(friday, 4)), current };
}

function mergeGames(
  byTeam: Map<string, string[]>,
  schedules: Map<string, GameRef[]>,
  keep: (g: GameRef) => boolean
): Map<string, { g: GameRef; sides: Array<{ teamId: string; ids: string[] }> }> {
  const games = new Map<string, { g: GameRef; sides: Array<{ teamId: string; ids: string[] }> }>();
  for (const [teamId, ids] of byTeam) {
    for (const g of schedules.get(teamId) ?? []) {
      if (g.source !== "espn" || !keep(g)) continue;
      const e = games.get(g.id) ?? { g, sides: [] };
      if (!e.sides.some((x) => x.teamId === teamId)) e.sides.push({ teamId, ids });
      games.set(g.id, e);
    }
  }
  return games;
}

/**
 * ESPN-Teamspielpläne sind nicht immer vollständig (z. B. fehlte AEK–Atromitos am
 * 17.10.2026, obwohl es im Liga-Scoreboard stand). Darum für das Wochenende zusätzlich
 * die Liga-Scoreboards der betroffenen Ligen abfragen und nach Event-ID zusammenführen.
 */
async function leagueFixtures(
  b: SquadBase,
  teamIds: string[],
  from: number,
  to: number,
  now: number
): Promise<Map<string, GameRef[]>> {
  const slugs = new Set<string>();
  for (const t of teamIds)
    for (const g of b.clubGames.get(t) ?? [])
      if (g.slug && !/^(uefa|fifa)\./.test(g.slug) && Date.parse(g.kickoff) >= now - 120 * 24 * H) slugs.add(g.slug);
  const days: string[] = [];
  for (let d = from; d < to; d += 24 * H) days.push(new Date(d).toISOString().slice(0, 10).replace(/-/g, ""));
  const jobs = [...slugs].flatMap((slug) => days.map((day) => ({ slug, day })));
  const res = await mapLimit(jobs, 6, ({ slug, day }) =>
    adaptive(
      ["abroad", "sb", slug, day],
      async () =>
        (await loadEvents(`${SITE_API}/${slug}/scoreboard?dates=${day}`))
          .map((e) => mapClubEvent({ ...e, league: { slug, name: e.league?.name } }))
          .filter((g): g is GameRef => g !== null),
      (gs) => gs.map((g) => g.kickoff),
      now
    )
  );
  const wanted = new Set(teamIds);
  const out = new Map<string, GameRef[]>();
  for (const r of res)
    for (const g of r?.data ?? [])
      for (const t of [g.homeId, g.awayId])
        if (t && wanted.has(t)) out.set(t, [...(out.get(t) ?? []), g]);
  return out;
}

export async function getWeekend(now = Date.now()): Promise<WeekendData | null> {
  try {
    const b = await loadSquadBase(now, { withHnl: false });
    const w = weekendWindow(now);
    const abroad = playersByTeam(b, (t) => !ESPN_TEAM_TO_HNL[t]);
    const extra = await leagueFixtures(b, [...abroad.keys()], w.from, w.to, now);
    const schedules = new Map(b.clubGames);
    for (const [t, gs] of extra) {
      const byId = new Map((schedules.get(t) ?? []).map((g) => [g.id, g]));
      for (const g of gs) byId.set(g.id, g); // Scoreboard ist aktueller als der Teamspielplan
      schedules.set(t, [...byId.values()]);
    }
    const merged = mergeGames(abroad, schedules, (g) => {
      const k = Date.parse(g.kickoff);
      return k >= w.from && k < w.to && g.state !== "cancelled";
    });
    const list = [...merged.values()].sort((x, y) => Date.parse(x.g.kickoff) - Date.parse(y.g.kickoff));
    const games = await mapLimit(list, 4, async ({ g, sides }) => ({
      game: g,
      croSides: sides.map((s) => s.teamId),
      croClubs: [],
      players: await playersIn(b, g, sides, now),
    }));
    const busy = new Set(games.flatMap((g) => g.players.map((p) => p.id)));
    const idle = [...abroad.values()]
      .flat()
      .filter((id) => !busy.has(id))
      .map((id) => ({ id, name: nameOf(b, id), club: clubOf(b, id) }))
      .sort((x, y) => x.name.split(" ").at(-1)!.localeCompare(y.name.split(" ").at(-1)!, "hr"));
    const gaps = [...b.gaps];
    const missing = [...abroad.keys()].filter((t) => !b.clubGames.has(t)).length;
    if (missing) gaps.push(`clubs:${missing}`);
    return {
      from: new Date(w.from).toISOString(),
      to: new Date(w.to).toISOString(),
      current: w.current,
      games,
      idle,
      abroadCount: [...abroad.values()].flat().length,
      fetchedAt: b.fetchedAts.sort()[0],
      gaps,
    };
  } catch (err) {
    console.error("[data] weekend failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

function mondayOf(iso: string): string {
  const ymd = viennaYmd(iso);
  const wd = viennaWeekday(Date.parse(iso));
  return addDaysYmd(ymd, -((wd + 6) % 7));
}

/** n-tes Ligaphasen-Spiel eines Vereins in diesem Wettbewerb = Spieltag n. */
function matchdayOf(g: GameRef, schedules: Map<string, GameRef[]>): number | undefined {
  if (g.phase !== "League Phase") return undefined;
  for (const t of [g.homeId, g.awayId]) {
    const s = t ? schedules.get(t) : undefined;
    if (!s) continue;
    const lp = s
      .filter((x) => x.slug === g.slug && x.phase === "League Phase")
      .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
    const i = lp.findIndex((x) => x.id === g.id);
    if (i >= 0) return i + 1;
  }
  return undefined;
}

export async function getEurope(now = Date.now()): Promise<EuropeData | null> {
  try {
    const b = await loadSquadBase(now, { withHnl: false });
    const gaps = [...b.gaps];
    // Kroatische Vereine (ESPN führt deren Europacup-Spiele)
    const croTeams = Object.keys(ESPN_TEAM_TO_HNL);
    const croSched = await mapLimit(croTeams, 4, (t) =>
      adaptive(["players", "club", t], () => loadClubGames(t), (gs) => gs.map((g) => g.kickoff), now)
    );
    const schedules = new Map(b.clubGames);
    croSched.forEach((s, i) => {
      if (s) schedules.set(croTeams[i], s.data);
      else gaps.push(`club:${ESPN_TEAM_TO_HNL[croTeams[i]]}`);
    });

    const byTeam = playersByTeam(b, () => true);
    for (const t of croTeams) if (!byTeam.has(t)) byTeam.set(t, []);
    const since = now - 42 * 24 * H;
    const merged = mergeGames(byTeam, schedules, (g) => !!g.slug && EUROPE_SLUG.test(g.slug) && Date.parse(g.kickoff) >= since);
    const list = [...merged.values()].sort((x, y) => Date.parse(x.g.kickoff) - Date.parse(y.g.kickoff));
    if (list.length === 0 && croSched.every((s) => !s)) throw new Error("no europe data");

    const upcoming = (g: GameRef) => g.state === "in" || (g.state === "pre" && Date.parse(g.kickoff) >= now - 3 * H);
    const nextKey = list.filter((x) => upcoming(x.g)).map((x) => mondayOf(x.g.kickoff)).sort()[0];
    const lastKey = list
      .map((x) => mondayOf(x.g.kickoff))
      .filter((k) => !nextKey || k < nextKey)
      .sort()
      .at(-1);

    const build = async (key: string | undefined): Promise<EuropeWeek | null> => {
      if (!key) return null;
      const items = list.filter((x) => mondayOf(x.g.kickoff) === key);
      const games = await mapLimit(items, 4, async ({ g, sides }) => ({
        game: g,
        croSides: sides.map((s) => s.teamId),
        croClubs: sides.map((s) => ESPN_TEAM_TO_HNL[s.teamId]).filter(Boolean),
        players: await playersIn(b, g, sides.filter((s) => s.ids.length), now),
        matchday: matchdayOf(g, schedules),
      }));
      return { from: new Date(viennaMidnight(key)).toISOString(), games };
    };
    const [last, next] = await Promise.all([build(lastKey), build(nextKey)]);

    // Welche kroatischen Vereine sind in dieser Saison (Ligaphase) dabei?
    const clubs: EuropeData["clubs"] = [];
    croSched.forEach((s, i) => {
      const lp = s?.data.find((g) => g.phase === "League Phase" && g.slug && EUROPE_SLUG.test(g.slug) && !g.slug.endsWith("_qual") && Date.parse(g.kickoff) >= now - 200 * 24 * H);
      if (lp) clubs.push({ name: ESPN_TEAM_TO_HNL[croTeams[i]], competition: lp.competition });
    });
    return { last, next, clubs, fetchedAt: b.fetchedAts.sort()[0], gaps };
  } catch (err) {
    console.error("[data] europe failed:", err instanceof Error ? err.message : err);
    return null;
  }
}


/** Europacup-Spiele der kroatischen Vereine (für den Kalender), ab 60 Tagen zurück. */
export async function getCroClubEuropeGames(now = Date.now()): Promise<{ games: GameRef[]; fetchedAt: string } | null> {
  const croTeams = Object.keys(ESPN_TEAM_TO_HNL);
  const sched = await mapLimit(croTeams, 4, (t) =>
    adaptive(["players", "club", t], () => loadClubGames(t), (gs) => gs.map((g) => g.kickoff), now)
  );
  if (sched.every((s) => !s)) return null;
  const byId = new Map<string, GameRef>();
  for (const s of sched)
    for (const g of s?.data ?? [])
      if (g.slug && EUROPE_SLUG.test(g.slug) && Date.parse(g.kickoff) >= now - 60 * 24 * H) byId.set(g.id, g);
  return {
    games: [...byId.values()].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff)),
    fetchedAt: sched.map((s) => s?.fetchedAt).filter((x): x is string => !!x).sort()[0],
  };
}
