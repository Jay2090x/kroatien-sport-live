import { cachedSource, liveSource } from "../cache";
import { fetchJson } from "../http";
import { CLUB_COMPETITION_DE, PLAYER_NAME, clubDe } from "../players-meta";
import { NBA_PLAYERS } from "../sport-meta";
import { COMPETITION_DE } from "./espn";
import { kindOf, type TickerKind } from "./live";
import { minuteOf, surname, trackedSoccer } from "./live-bar";
import { getHnl } from "./hnl";

/**
 * Spielseite für jedes Spiel aus der LIVE-Leiste (Vereinsspiele der Kroaten, NBA, HNL).
 *  - ESPN-Spielbericht ("summary", kostenlos, ohne Schlüssel): Spielstand, Minute, Tore/Karten/Wechsel,
 *    Aufstellungen, Teamstatistik, NBA-Boxscore und die Tabelle des Wettbewerbs (falls ESPN sie mitliefert).
 *  - SuperSport HNL (ESPN führt sie nicht): TheSportsDB (Spiel, Stadion, Livestand) + die vorhandene HNL-Tabelle.
 * Was eine Quelle nicht liefert, fehlt auf der Seite – nichts wird geschätzt.
 */

const ESPN = "https://site.api.espn.com/apis/site/v2/sports";
const TSDB = "https://www.thesportsdb.com/api/v1/json/123";
export const SOCCER_SLUG = /^[a-z]{3,4}\.[a-z0-9_]{1,24}(\.[a-z]{2,8})?$/;

export type GameSport = "soccer" | "nba" | "hnl";

export interface GameSide {
  id: string;
  name: string; // Datenname (DE), Übersetzung in der Ansicht
  abbr: string | null;
  /** kurzer Name für die Anzeigetafel (NBA: "Cavaliers") */
  short: string | null;
  score: number | null;
  /** Kroaten in diesem Team (Kurznamen) */
  croats: string[];
}
export interface GameEvent {
  kind: Exclude<TickerKind, "half" | "end">;
  minute: string;
  side: "home" | "away" | null;
  names: string[];
  croat: boolean;
}
export interface GamePlayer {
  id: string;
  name: string;
  jersey: string | null;
  pos: string | null;
  starter: boolean;
  subIn: boolean;
  subOut: boolean;
  croat: boolean;
}
export interface GameLineup {
  side: "home" | "away";
  formation: string | null;
  players: GamePlayer[];
}
export interface GameStat {
  key: string;
  home: string;
  away: string;
}
export interface BoxRow {
  id: string;
  name: string;
  starter: boolean;
  croat: boolean;
  cells: Record<string, string>; // MIN PTS REB AST ...
}
export interface Standing {
  title: string | null;
  /** fester Tabellen-Titel (Datenname, z. B. "Premier League"), wenn es nicht die Tabelle des Spiels selbst ist */
  label?: string;
  kind: "soccer" | "nba";
  rows: Array<{ rank: number | null; teamId: string; team: string; c: Record<string, string> }>;
}
export interface Game {
  sport: GameSport;
  league: string;
  id: string;
  competition: string;
  kickoff: string | null;
  venue: string | null;
  state: "pre" | "in" | "post" | "unknown";
  /** Fußball: "67'", "45+2'"; NBA: "Q3 5:42"; null bei Pause/unbekannt */
  clock: string | null;
  halftime: boolean;
  /** ESPN-Detail wie "FT", "Final/OT", "AET" */
  detail: string | null;
  home: GameSide;
  away: GameSide;
  events: GameEvent[];
  lineups: GameLineup[];
  stats: GameStat[];
  box: Array<{ side: "home" | "away"; cols: string[]; rows: BoxRow[] }>;
  standings: Standing[];
  round: number | null;
  source: string;
  fetchedAt: string;
}

/* ---------- ESPN ---------- */

interface RawAth { id?: string; displayName?: string }
interface RawSum {
  header?: {
    league?: { name?: string };
    competitions?: Array<{
      date?: string;
      status?: { displayClock?: string; period?: number; type?: { name?: string; state?: string; completed?: boolean; shortDetail?: string } };
      competitors?: Array<{ homeAway?: string; score?: string; team?: { id?: string; displayName?: string; abbreviation?: string; shortDisplayName?: string; name?: string } }>;
    }>;
  };
  gameInfo?: { venue?: { fullName?: string; address?: { city?: string } } };
  keyEvents?: Array<{ type?: { text?: string }; clock?: { displayValue?: string }; team?: { id?: string }; participants?: Array<{ athlete?: RawAth }> }>;
  rosters?: Array<{
    team?: { id?: string };
    formation?: string;
    roster?: Array<{
      athlete?: RawAth;
      jersey?: string;
      starter?: boolean;
      subbedIn?: boolean | { didSub?: boolean };
      subbedOut?: boolean | { didSub?: boolean };
      position?: { abbreviation?: string };
    }>;
  }>;
  boxscore?: {
    teams?: Array<{ team?: { id?: string }; statistics?: Array<{ name?: string; displayValue?: string }> }>;
    players?: Array<{
      team?: { id?: string };
      statistics?: Array<{ names?: string[]; athletes?: Array<{ athlete?: RawAth; starter?: boolean; didNotPlay?: boolean; stats?: string[] }> }>;
    }>;
  };
  standings?: {
    groups?: Array<{
      header?: string;
      standings?: { entries?: Array<{ team?: string; id?: string; stats?: Array<{ name?: string; displayValue?: string }> }> };
    }>;
  };
}

const didSub = (v: boolean | { didSub?: boolean } | undefined) => (typeof v === "boolean" ? v : !!v?.didSub);

/** Teamwerte, die wir zeigen (Reihenfolge = Anzeige). ESPN liefert sie nur, wenn es sie erfasst. */
const SOCCER_STATS = ["possessionPct", "totalShots", "shotsOnTarget", "wonCorners", "foulsCommitted", "offsides", "yellowCards", "redCards", "saves", "accuratePasses"];
const NBA_STATS = [
  "fieldGoalsMade-fieldGoalsAttempted",
  "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
  "freeThrowsMade-freeThrowsAttempted",
  "totalRebounds",
  "assists",
  "steals",
  "blocks",
  "totalTurnovers",
  "pointsInPaint",
  "fastBreakPoints",
  "largestLead",
];
const NBA_BOX = ["MIN", "PTS", "REB", "AST", "FG", "3PT", "+/-"];
const NBA_PERIOD = (p: number | undefined) => (!p ? "" : p <= 4 ? `Q${p}` : p === 5 ? "OT" : `${p - 4}OT`);

export function parseEspnGame(j: RawSum, sport: "soccer" | "nba", league: string, id: string, croatById: Map<string, string>, fetchedAt: string): Game {
  const c = j.header?.competitions?.[0];
  const comps = c?.competitors ?? [];
  const home = comps.find((x) => x.homeAway === "home");
  const away = comps.find((x) => x.homeAway === "away");
  if (!home?.team?.id || !away?.team?.id) throw new Error(`ESPN summary ${league}/${id}: no competitors`);
  const st = c?.status;
  const state: Game["state"] = st?.type?.state === "in" ? "in" : st?.type?.state === "post" || st?.type?.completed ? "post" : st?.type?.state === "pre" ? "pre" : "unknown";
  const halftime = state === "in" && (st?.type?.name ?? "").toUpperCase().includes("HALFTIME");
  const nba = sport === "nba";
  const clock = state !== "in" || halftime ? null : nba ? [NBA_PERIOD(st?.period), st?.displayClock].filter(Boolean).join(" ") || null : minuteOf(st?.displayClock);
  const sideOf = (teamId: string | undefined): "home" | "away" | null => (teamId === home.team!.id ? "home" : teamId === away.team!.id ? "away" : null);
  const nm = (a: RawAth | undefined) => (a?.id && (croatById.has(a.id) ? PLAYER_NAME[a.id] : null)) || a?.displayName || "?";
  const isCro = (a: RawAth | undefined) => !!a?.id && croatById.has(a.id);

  const lineups: GameLineup[] = [];
  for (const r of j.rosters ?? []) {
    const side = sideOf(r.team?.id);
    if (!side || !r.roster?.length) continue;
    lineups.push({
      side,
      formation: r.formation ?? null,
      players: r.roster
        .filter((p) => p.athlete?.id)
        .map((p) => ({
          id: String(p.athlete!.id),
          name: nm(p.athlete),
          jersey: p.jersey ?? null,
          pos: p.position?.abbreviation ?? null,
          starter: !!p.starter,
          subIn: didSub(p.subbedIn),
          subOut: didSub(p.subbedOut),
          croat: isCro(p.athlete),
        })),
    });
  }

  const events: GameEvent[] = [];
  for (const k of j.keyEvents ?? []) {
    const kind = kindOf(k.type?.text ?? "");
    if (!kind || kind === "half" || kind === "end") continue;
    const ps = (k.participants ?? []).map((p) => p.athlete);
    events.push({
      kind,
      minute: minuteOf(k.clock?.displayValue) ?? "",
      side: sideOf(k.team?.id),
      names: ps.map(nm),
      croat: ps.some(isCro),
    });
  }

  const stats: GameStat[] = [];
  const t = j.boxscore?.teams ?? [];
  const val = (teamId: string, key: string) =>
    t.find((x) => x.team?.id === teamId)?.statistics?.find((s) => s.name === key)?.displayValue;
  for (const key of nba ? NBA_STATS : SOCCER_STATS) {
    const h = val(home.team.id, key);
    const a = val(away.team.id, key);
    if (h != null && a != null) stats.push({ key, home: h, away: a });
  }
  // Fußball: ESPN liefert vor Anpfiff Nullen – dann keine Statistik zeigen
  if (!nba && state === "pre") stats.length = 0;

  const box: Game["box"] = [];
  if (nba) {
    for (const p of j.boxscore?.players ?? []) {
      const side = sideOf(p.team?.id);
      const s = p.statistics?.[0];
      if (!side || !s?.names?.length) continue;
      const idx = Object.fromEntries(s.names.map((n, i) => [n, i]));
      const rows = (s.athletes ?? [])
        .filter((a) => a.athlete?.id && !a.didNotPlay && a.stats?.length)
        .map((a) => ({
          id: String(a.athlete!.id),
          name: a.athlete!.displayName ?? "?",
          starter: !!a.starter,
          croat: nbaCroat.has(String(a.athlete!.id)),
          cells: Object.fromEntries(NBA_BOX.filter((n) => idx[n] != null).map((n) => [n, a.stats![idx[n]] ?? ""])),
        }));
      if (rows.length) box.push({ side, cols: NBA_BOX.filter((n) => idx[n] != null), rows });
    }
  }

  const standings: Standing[] = [];
  for (const g of j.standings?.groups ?? []) {
    const entries = g.standings?.entries ?? [];
    if (!entries.length) continue;
    standings.push({
      title: g.header ?? null,
      kind: nba ? "nba" : "soccer",
      rows: entries.map((e, i) => {
        const c2 = Object.fromEntries((e.stats ?? []).map((s) => [s.name ?? "", s.displayValue ?? ""]));
        const rank = Number(c2.rank);
        return { rank: Number.isFinite(rank) && rank > 0 ? rank : nba ? i + 1 : null, teamId: String(e.id ?? ""), team: nba ? e.team ?? "?" : clubDe(e.team ?? "?"), c: c2 };
      }),
    });
  }

  const croatsOf = (teamId: string) => {
    if (nba) return [...new Set(box.flatMap((b) => (b.side === sideOf(teamId) ? b.rows.filter((r) => r.croat).map((r) => surname(r.name)) : [])))];
    const lu = lineups.find((l) => l.side === sideOf(teamId));
    return lu ? lu.players.filter((p) => p.croat).map((p) => surname(p.name)) : [];
  };
  const side = (x: typeof home): GameSide => {
    const n = Number(x.score);
    return {
      id: x.team!.id!,
      name: nba ? x.team!.displayName ?? "?" : clubDe(x.team!.displayName ?? "?"),
      abbr: x.team!.abbreviation ?? null,
      short: nba ? x.team!.name ?? x.team!.shortDisplayName ?? null : null,
      score: state === "pre" || x.score == null || x.score === "" || !Number.isFinite(n) ? null : n,
      croats: croatsOf(x.team!.id!),
    };
  };
  const v = j.gameInfo?.venue;
  return {
    sport,
    league,
    id,
    competition: nba ? "NBA" : CLUB_COMPETITION_DE[league] || COMPETITION_DE[league] || j.header?.league?.name || league,
    kickoff: c?.date ? new Date(c.date).toISOString() : null,
    venue: v?.fullName ? `${v.fullName}${v.address?.city ? `, ${v.address.city}` : ""}` : null,
    state,
    clock,
    halftime,
    detail: st?.type?.shortDetail ?? null,
    home: side(home),
    away: side(away),
    events,
    lineups,
    stats,
    box,
    standings,
    round: null,
    source: "ESPN",
    fetchedAt,
  };
}

const nbaCroat = new Set(NBA_PLAYERS.map((p) => p.espnId));

async function espnGame(sport: "soccer" | "nba", league: string, id: string): Promise<Game | null> {
  const url = `${ESPN}/${sport === "nba" ? "basketball/nba" : `soccer/${league}`}/summary?event=${id}`;
  const croatById = sport === "soccer" ? (await trackedSoccer(Date.now()).catch(() => null))?.croatById ?? new Map<string, string>() : new Map<string, string>();
  const s = await liveSource(["game", sport, league, id], 15, async () => {
    const j = await fetchJson<RawSum>(url, { timeoutMs: 7000, retries: 1 });
    if (!j.header) throw new Error(`ESPN summary ${league}/${id}: unexpected format`);
    return j;
  });
  if (!s) return null;
  const g = parseEspnGame(s.data, sport, league, id, croatById, s.fetchedAt);
  if (sport === "soccer" && !g.standings.length) g.standings = await fallbackStandings(league, [g.home.id, g.away.id]).catch(() => []);
  return g;
}

/* Pokal/K.-o.-Spiele: Tabelle des Wettbewerbs selbst (z. B. UEFA-Ligaphase), sonst die Ligatabelle(n) beider Vereine. */
interface RawV2 {
  name?: string;
  children?: Array<{ name?: string; standings?: { entries?: Array<{ team?: { id?: string; displayName?: string }; stats?: Array<{ name?: string; displayValue?: string }> }> } }>;
}
async function v2Standings(slug: string, label: string | undefined, fixed = false): Promise<Standing[]> {
  const s = await cachedSource(["game", "v2table", slug], 1800, async () => {
    const j = await fetchJson<RawV2>(`https://site.api.espn.com/apis/v2/sports/soccer/${slug}/standings`, { timeoutMs: 6000, retries: 1 });
    return j;
  });
  const out: Standing[] = [];
  const kids = s?.data.children ?? [];
  for (const k of kids) {
    const entries = k.standings?.entries ?? [];
    if (!entries.length) continue;
    out.push({
      title: k.name ?? null,
      label: label ?? (kids.length > 1 || fixed ? k.name?.replace(/^\d{4}(-\d{2,4})?\s+/, "") : undefined),
      kind: "soccer",
      rows: entries.map((e) => {
        const c = Object.fromEntries((e.stats ?? []).map((x) => [x.name ?? "", x.displayValue ?? ""]));
        if (c.pointsFor && c.pointsAgainst) c.goals = `${c.pointsFor}:${c.pointsAgainst}`;
        const rank = Number(c.rank);
        return { rank: Number.isFinite(rank) && rank > 0 ? rank : null, teamId: String(e.team?.id ?? ""), team: clubDe(e.team?.displayName ?? "?"), c };
      }),
    });
  }
  return out;
}
async function fallbackStandings(league: string, teamIds: string[]): Promise<Standing[]> {
  const has = (st: Standing[]) => st.some((x) => x.rows.some((r) => teamIds.includes(r.teamId)));
  if (/^uefa\./.test(league)) {
    const own = await v2Standings(league, undefined).catch(() => []);
    if (has(own)) return own;
  }
  const slugs: string[] = [];
  for (const t of teamIds) {
    const d = await cachedSource(["game", "teamleague", t], 86400, async () => {
      const j = await fetchJson<{ team?: { defaultLeague?: { slug?: string } } }>(`${ESPN}/soccer/${league}/teams/${t}`, { timeoutMs: 5000, retries: 1 });
      const sl = j.team?.defaultLeague?.slug;
      if (!sl) throw new Error(`ESPN team ${t}: no default league`);
      return sl;
    }).catch(() => null);
    if (d && SOCCER_SLUG.test(d.data) && d.data !== league && !slugs.includes(d.data)) slugs.push(d.data);
  }
  const out: Standing[] = [];
  for (const sl of slugs) {
    const st = await v2Standings(sl, CLUB_COMPETITION_DE[sl] || COMPETITION_DE[sl] || undefined, true).catch(() => []);
    if (has(st)) out.push(...st.filter((x) => x.rows.some((r) => teamIds.includes(r.teamId))));
  }
  return out;
}

/* ---------- SuperSport HNL (TheSportsDB + vorhandene Tabelle) ---------- */

interface TsdbEv {
  idEvent?: string;
  idLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  strTimestamp?: string | null;
  strVenue?: string | null;
  intRound?: string | null;
}
const TSDB_LIVE = new Set(["1H", "2H", "HT", "ET", "BT", "P", "PEN", "LIVE"]);
const TSDB_DONE = new Set(["FT", "AET", "PEN", "MATCH FINISHED", "AFTER EXTRA TIME", "AFTER PENALTIES"]);

async function hnlGame(id: string): Promise<Game | null> {
  const ev = await liveSource(["game", "hnl", id], 20, async () => {
    const [one, live] = await Promise.all([
      fetchJson<{ events?: TsdbEv[] | null }>(`${TSDB}/lookupevent.php?id=${id}`, { timeoutMs: 5000, retries: 1 }),
      fetchJson<{ livescore?: TsdbEv[] | null }>(`${TSDB}/livescore.php?s=Soccer`, { timeoutMs: 4000, retries: 0 }).catch(() => ({ livescore: null })),
    ]);
    const e = one.events?.[0];
    if (!e || e.idEvent !== id || e.idLeague !== "4629") throw new Error(`TheSportsDB event ${id}: not an HNL match`);
    const l = (live.livescore ?? []).find((x) => x.idEvent === id);
    return l ? { ...e, ...Object.fromEntries(Object.entries(l).filter(([, v]) => v != null && v !== "")), strVenue: e.strVenue } : e;
  });
  if (!ev) return null;
  const e = ev.data;
  const hnl = await getHnl().catch(() => null);
  const m = hnl?.data.matches.find((x) => x.id === id);
  const status = (e.strStatus ?? "").toUpperCase().trim();
  const state: Game["state"] = TSDB_LIVE.has(status) || m?.state === "live"
    ? "in"
    : TSDB_DONE.has(status) || m?.state === "finished"
      ? "post"
      : m?.state === "scheduled" || status === "NS"
        ? "pre"
        : "unknown";
  const num = (v: string | null | undefined) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  const halftime = status === "HT";
  const prog = state === "in" && !halftime && e.strProgress && /^\d/.test(e.strProgress) ? minuteOf(e.strProgress) : null;
  const home = m?.home ?? e.strHomeTeam ?? "?";
  const away = m?.away ?? e.strAwayTeam ?? "?";
  const ts = e.strTimestamp ? Date.parse(`${e.strTimestamp.replace(/Z$/, "")}Z`) : NaN;
  const table = hnl?.data.table ?? [];
  return {
    sport: "hnl",
    league: "hnl",
    id,
    competition: "SuperSport HNL",
    kickoff: m?.kickoff ?? (Number.isFinite(ts) ? new Date(ts).toISOString() : null),
    venue: e.strVenue || null,
    state,
    clock: prog,
    halftime,
    detail: null,
    home: { id: home, name: home, abbr: null, short: null, score: state === "pre" ? null : num(e.intHomeScore) ?? m?.homeScore ?? null, croats: [] },
    away: { id: away, name: away, abbr: null, short: null, score: state === "pre" ? null : num(e.intAwayScore) ?? m?.awayScore ?? null, croats: [] },
    events: [],
    lineups: [],
    stats: [],
    box: [],
    standings: table.length
      ? [
          {
            title: null,
            kind: "soccer",
            rows: table.map((r) => ({
              rank: r.rank,
              teamId: r.team,
              team: r.team,
              c: {
                gamesPlayed: String(r.played),
                wins: String(r.won),
                ties: String(r.drawn),
                losses: String(r.lost),
                goals: `${r.goalsFor}:${r.goalsAgainst}`,
                pointDifferential: `${r.goalsFor - r.goalsAgainst > 0 ? "+" : ""}${r.goalsFor - r.goalsAgainst}`,
                points: String(r.points),
              },
            })),
          },
        ]
      : [],
    round: m?.round ?? num(e.intRound),
    source: "TheSportsDB",
    fetchedAt: ev.fetchedAt,
  };
}

/** Spiel laden; null = unbekannt/Quelle nicht erreichbar. */
export async function getGame(league: string, id: string): Promise<Game | null> {
  if (!/^\d{3,12}$/.test(id)) return null;
  try {
    if (league === "hnl") return await hnlGame(id);
    if (league === "nba") return await espnGame("nba", "nba", id);
    if (SOCCER_SLUG.test(league)) return await espnGame("soccer", league, id);
  } catch (err) {
    console.error("[data] game failed:", league, id, err instanceof Error ? err.message : err);
  }
  return null;
}

export const gamePath = (league: string, id: string) => `/spiel/${league}/${id}`;
