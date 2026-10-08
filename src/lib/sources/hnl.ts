import { cachedSource, REVALIDATE, type Sourced } from "../cache";
import { fetchJson } from "../http";
import { hnlTeam } from "../names";

/**
 * SuperSport HNL über TheSportsDB (Free-Key "123", kein Konto nötig).
 * Die Tabelle wird aus den Rundenergebnissen selbst berechnet, weil der
 * Free-Key bei lookuptable nur die Top 5 liefert.
 */
const TSDB = "https://www.thesportsdb.com/api/v1/json/123";
export const HNL_LEAGUE_ID = "4629";
const ROUNDS_PER_SEASON = 36; // 10 Teams, je 4 Duelle

interface TsdbEvent {
  idEvent: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  intRound: string | null;
  strTimestamp: string | null;
  dateEvent: string | null;
  strTime: string | null;
  strStatus: string | null;
  strPostponed: string | null;
}

export type HnlState = "finished" | "live" | "scheduled" | "postponed";

export interface HnlMatch {
  id: string;
  round: number;
  kickoff: string | null;
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  state: HnlState;
}

export interface HnlRow {
  rank: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface HnlData {
  season: string;
  table: HnlRow[];
  currentRound: number;
  currentRoundMatches: HnlMatch[];
  previousRound: number | null;
  previousRoundMatches: HnlMatch[];
  postponed: HnlMatch[];
}

const FINISHED = new Set(["FT", "AET", "PEN", "MATCH FINISHED", "AFTER EXTRA TIME", "AFTER PENALTIES"]);
const POSTPONED = new Set(["PST", "POSTPONED", "CANC", "CANCELLED", "ABD", "ABANDONED", "SUSP"]);
const LIVE = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "IN PLAY"]);

function kickoffOf(e: TsdbEvent): string | null {
  if (e.strTimestamp) return new Date(`${e.strTimestamp.replace(/Z$/, "")}Z`).toISOString();
  if (e.dateEvent) return new Date(`${e.dateEvent}T${e.strTime || "00:00:00"}Z`).toISOString();
  return null;
}

function num(v: string | null): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mapTsdbEvent(e: TsdbEvent, now = Date.now()): HnlMatch {
  const kickoff = kickoffOf(e);
  const status = (e.strStatus ?? "").toUpperCase().trim();
  const hs = num(e.intHomeScore);
  const as = num(e.intAwayScore);
  const started = kickoff ? Date.parse(kickoff) <= now : false;
  let state: HnlState;
  if (POSTPONED.has(status) || e.strPostponed === "yes") state = "postponed";
  else if (FINISHED.has(status) && hs != null && as != null) state = "finished";
  else if (LIVE.has(status)) state = "live";
  else if (hs != null && as != null && kickoff && Date.parse(kickoff) < now - 3 * 3600_000)
    state = "finished"; // Ergebnis vorhanden, Status fehlt
  else if (started && kickoff && Date.parse(kickoff) < now - 3 * 3600_000)
    state = "postponed"; // längst vorbei, aber kein Ergebnis → als verschoben behandeln
  else state = started ? "live" : "scheduled";

  return {
    id: e.idEvent,
    round: Number(e.intRound) || 0,
    kickoff,
    home: hnlTeam(e.strHomeTeam),
    away: hnlTeam(e.strAwayTeam),
    homeScore: state === "scheduled" || state === "postponed" ? null : hs,
    awayScore: state === "scheduled" || state === "postponed" ? null : as,
    state,
  };
}

export function computeTable(matches: HnlMatch[], teams: string[]): HnlRow[] {
  const rows = new Map<string, HnlRow>();
  const row = (t: string) => {
    let r = rows.get(t);
    if (!r) {
      r = { rank: 0, team: t, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
      rows.set(t, r);
    }
    return r;
  };
  teams.forEach(row);
  for (const m of matches) {
    if (m.state !== "finished" || m.homeScore == null || m.awayScore == null) continue;
    const h = row(m.home);
    const a = row(m.away);
    h.played++;
    a.played++;
    h.goalsFor += m.homeScore;
    h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore;
    a.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.won++;
      a.lost++;
      h.points += 3;
    } else if (m.homeScore < m.awayScore) {
      a.won++;
      h.lost++;
      a.points += 3;
    } else {
      h.drawn++;
      a.drawn++;
      h.points++;
      a.points++;
    }
  }
  // Sortierung: Punkte, Tordifferenz, erzielte Tore (vereinfachte Reihung)
  const sorted = [...rows.values()].sort(
    (x, y) =>
      y.points - x.points ||
      y.goalsFor - y.goalsAgainst - (x.goalsFor - x.goalsAgainst) ||
      y.goalsFor - x.goalsFor ||
      x.team.localeCompare(y.team, "hr")
  );
  sorted.forEach((r, i) => (r.rank = i + 1));
  return sorted;
}

async function getSeason(): Promise<string> {
  const res = await cachedSource(["hnl", "season"], REVALIDATE.day, async () => {
    const json = await fetchJson<{ leagues?: Array<{ strCurrentSeason?: string }> }>(
      `${TSDB}/lookupleague.php?id=${HNL_LEAGUE_ID}`
    );
    const s = json.leagues?.[0]?.strCurrentSeason;
    if (!s || !/^\d{4}-\d{4}$/.test(s)) throw new Error("TSDB: no current season");
    return s;
  });
  if (res) return res.data;
  const now = new Date();
  const y = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${y}-${y + 1}`;
}

async function getNextRound(): Promise<number | null> {
  const res = await cachedSource(["hnl", "next-round"], REVALIDATE.hnl, async () => {
    const json = await fetchJson<{ events?: TsdbEvent[] | null }>(
      `${TSDB}/eventsnextleague.php?id=${HNL_LEAGUE_ID}`
    );
    const r = Number(json.events?.[0]?.intRound);
    // 0 = Saisonende / keine angesetzten Spiele
    return Number.isFinite(r) && r > 0 ? r : 0;
  });
  return res ? res.data : null;
}

async function loadRound(season: string, round: number): Promise<TsdbEvent[]> {
  const json = await fetchJson<{ events?: TsdbEvent[] | null }>(
    `${TSDB}/eventsround.php?id=${HNL_LEAGUE_ID}&r=${round}&s=${season}`,
    { retries: 2 }
  );
  return json.events ?? [];
}

/** Rundendaten mit gestaffelter Revalidierung (alte, abgeschlossene Runden selten). */
function getRound(season: string, round: number, old: boolean) {
  return cachedSource(
    ["hnl", "round", season, String(round), old ? "old" : "recent"],
    old ? REVALIDATE.hnlOldRound : REVALIDATE.hnl,
    () => loadRound(season, round)
  );
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

export async function loadHnl(now = Date.now()): Promise<Sourced<HnlData>> {
  const season = await getSeason();
  const nextRound = await getNextRound();
  if (nextRound === null) throw new Error("TSDB: next round unknown");
  const current = nextRound === 0 ? ROUNDS_PER_SEASON : nextRound;
  const lastRound = Math.min(ROUNDS_PER_SEASON, current);

  const roundNumbers = Array.from({ length: lastRound }, (_, k) => k + 1);
  const rounds = await mapLimit(roundNumbers, 4, async (r) => {
    // Runden, die >3 Runden zurückliegen, sind meist abgeschlossen → seltener laden.
    if (r >= current - 3) return getRound(season, r, false);
    const archived = await getRound(season, r, true);
    // Enthält eine alte Runde Nachholspiele (verschoben/offen), stündlich nachladen.
    const open = archived?.data.some((e) => mapTsdbEvent(e, now).state !== "finished");
    return open ? ((await getRound(season, r, false)) ?? archived) : archived;
  });
  const missing = roundNumbers.filter((_, k) => rounds[k] === null);
  if (missing.length) throw new Error(`TSDB: rounds missing (${missing.join(",")})`);

  const all = rounds.flatMap((r) => (r?.data ?? []).map((e) => mapTsdbEvent(e, now)));
  // "Stand" = ältester Abruf der laufenden (stündlich aktualisierten) Runden
  const fetchedAt = rounds
    .filter((_, k) => roundNumbers[k] >= current - 3)
    .map((r) => r?.fetchedAt ?? new Date(now).toISOString())
    .sort()[0];
  if (all.length < 5) throw new Error("TSDB: too few events");

  const teams = [...new Set(all.flatMap((m) => [m.home, m.away]))];
  if (teams.length < 8 || teams.length > 12) throw new Error(`TSDB: unexpected team count ${teams.length}`);

  const table = computeTable(all, teams);
  const byKick = (a: HnlMatch, b: HnlMatch) =>
    (a.kickoff ? Date.parse(a.kickoff) : 0) - (b.kickoff ? Date.parse(b.kickoff) : 0);
  const currentRoundMatches = all.filter((m) => m.round === current).sort(byKick);
  const previousRound = current > 1 ? current - 1 : null;
  const previousRoundMatches = previousRound
    ? all.filter((m) => m.round === previousRound && m.state !== "postponed").sort(byKick)
    : [];
  const postponed = all.filter((m) => m.state === "postponed").sort((a, b) => a.round - b.round);

  return {
    data: { season, table, currentRound: current, currentRoundMatches, previousRound, previousRoundMatches, postponed },
    fetchedAt,
  };
}

/** HNL-Daten für die Seite; `null` = derzeit keine Daten. */
export async function getHnl(): Promise<Sourced<HnlData> | null> {
  try {
    return await loadHnl();
  } catch (err) {
    console.error("[data] hnl failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
