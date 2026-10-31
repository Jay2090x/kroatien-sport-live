import { cachedSource, type Sourced } from "../cache";
import { fetchJson } from "../http";
import { mapLimit } from "../async";
import {
  CLUB_COMPETITION_DE,
  ESPN_TEAM_TO_HNL,
  PLAYER_NAME,
  POSITION_GROUP,
  SQUAD_NOTES,
  clubDe,
} from "../players-meta";
import {
  COMPETITION_DE,
  ESPN_CROATIA_ID,
  SITE_API,
  leagueSlugOf,
  loadEspnCroatiaMatches,
  loadEvents,
  scoreOf,
  stateOf,
  type EspnEvent,
} from "./espn";
import {
  lineupStatusOf,
  loadSummary,
  performanceOf,
  type LineupStatus,
  type MatchSummary,
  type Performance,
} from "./espn-summary";
import { getHnl, type HnlMatch } from "./hnl";
import type { MatchState } from "./types";

/**
 * Spielerseite: aktueller Kroatien-Kader mit letztem/nächstem Spiel.
 *
 * Kader   = alle Spieler in den ESPN-Spieltagskadern der letzten
 *           Länderspielphase (Spiele bis 21 Tage vor dem letzten Länderspiel).
 * Verein  = ESPN-Athletenprofil (athlete.team.id) – reine ID-Zuordnung.
 * Spiele  = ESPN-Teamspielplan (ohne Testspiele); HNL-Ligaspiele über
 *           TheSportsDB (dort gibt es im Free-Tarif keine Spielerdaten).
 * Details = ESPN-Spielbericht (Kader, Wechsel, Karten, Tore, Vorlagen).
 */

export const PLAYER_REVALIDATE = {
  base: 30 * 60, // 30 min
  near: 5 * 60, // ±Anpfiff eines Spielers
  athlete: 6 * 3600,
  final: 24 * 3600, // abgeschlossene Spielberichte
} as const;

const H = 3600_000;
const NEAR_BEFORE = 2 * H;
const NEAR_AFTER = 3 * H;
/** Aufstellungen erscheinen meist ca. 1 h vor Anpfiff – ab 2 h vorher nachsehen. */
const LINEUP_LOOKAHEAD = 2 * H;
const WINDOW_DAYS = 21;
const WEB_API = "https://site.web.api.espn.com/apis/common/v3/sports/soccer";

export interface GameRef {
  source: "espn" | "tsdb";
  id: string;
  slug?: string;
  kickoff: string;
  home: string;
  away: string;
  homeId?: string;
  awayId?: string;
  homeScore: number | null;
  awayScore: number | null;
  extra?: string;
  state: MatchState;
  competition: string;
  isNationalTeam: boolean;
  /** ESPN-Saisonphase, z. B. "League Phase" (für Europacup-Spieltage) */
  phase?: string;
}

export interface PlayerGame {
  game: GameRef;
  isHome: boolean;
  /** null = Quelle liefert für dieses Spiel keine Spielerdaten */
  perf: Performance | null;
  /** Hinweis, warum keine Spielerdaten vorliegen */
  perfNote?: string;
}

export type NextLineup = LineupStatus | "pending" | "nodata";

export interface PlayerNext {
  game: GameRef;
  isHome: boolean;
  lineup: NextLineup;
  /** Länderspiel einer späteren Phase: Nominierung noch nicht bekannt */
  callUpOpen?: boolean;
  suspensionHint?: string;
}

export interface PlayerNote {
  kind: "warn" | "info";
  text: string;
}

/** Ein Punkt der Formkurve (abgeschlossenes Pflichtspiel, neuestes zuletzt) */
export interface FormPoint {
  kickoff: string;
  label: string; // "Gegner (Wettbewerb)"
  isNationalTeam: boolean;
  /** null = keine Spielerdaten für dieses Spiel */
  minutes: number | null;
  played: boolean | null;
  goals: number | null;
  assists: number | null;
  ownGoalMinutes: string[];
  penMissMinutes: string[];
  redMinute: string | null;
}

export interface PlayerRow {
  id: string;
  /** letzte 5 Pflichtspiele (Verein + Kroatien), ältestes zuerst */
  form: FormPoint[];
  name: string;
  position: string; // G | D | M | F | ?
  club: string | null;
  games: PlayerGame[]; // letzte Spiele (Verein + Kroatien), neuestes zuerst
  next: PlayerNext | null;
  notes: PlayerNote[];
}

export interface PlayersData {
  players: PlayerRow[];
  window: { from: string; to: string; matches: number };
  squadNote?: { text: string; textHr: string; source: string; url: string };
  fetchedAt: string;
  gaps: string[];
}

/* ------------------------------------------------------------------ */

function near(kickoffs: string[], now: number): boolean {
  return kickoffs.some((k) => {
    const t = Date.parse(k);
    return t - NEAR_BEFORE <= now && now <= t + NEAR_AFTER;
  });
}

/** 30-min-Cache, der rund um einen Anpfiff auf 5 min umschaltet. */
export async function adaptive<T>(
  key: string[],
  loader: () => Promise<T>,
  kickoffs: (t: T) => string[],
  now: number
): Promise<Sourced<T> | null> {
  const base = await cachedSource([...key, "base"], PLAYER_REVALIDATE.base, loader);
  if (base && near(kickoffs(base.data), now)) {
    return (await cachedSource([...key, "near"], PLAYER_REVALIDATE.near, loader)) ?? base;
  }
  return base;
}

function clubCompetition(slug: string | undefined, name: string | undefined): string {
  return (slug && (CLUB_COMPETITION_DE[slug] || COMPETITION_DE[slug])) || name || "Pflichtspiel";
}

export function mapClubEvent(e: EspnEvent): GameRef | null {
  const slug = leagueSlugOf(e);
  if (!slug || slug.endsWith(".friendly")) return null; // Testspiele ausblenden
  const c = e.competitions?.[0];
  const home = c?.competitors?.find((x) => x.homeAway === "home");
  const away = c?.competitors?.find((x) => x.homeAway === "away");
  if (!c || !home?.team?.id || !away?.team?.id || !e.date) return null;
  const state = stateOf(c.status);
  const scored = state === "in" || state === "post";
  const statusName = (c.status?.type?.name ?? "").toUpperCase();
  let extra: string | undefined;
  if (statusName.includes("PEN") && home.shootoutScore != null && away.shootoutScore != null) {
    extra = `n. E. ${home.shootoutScore}:${away.shootoutScore}`;
  } else if (statusName.includes("AET") || statusName.includes("EXTRA")) extra = "n. V.";
  return {
    source: "espn",
    id: e.id,
    slug,
    kickoff: new Date(e.date).toISOString(),
    home: clubDe(home.team.displayName ?? "?"),
    away: clubDe(away.team.displayName ?? "?"),
    homeId: home.team.id,
    awayId: away.team.id,
    homeScore: scored ? scoreOf(home) : null,
    awayScore: scored ? scoreOf(away) : null,
    extra,
    state,
    competition: clubCompetition(slug, e.league?.name),
    isNationalTeam: false,
    phase: e.seasonType?.name,
  };
}

export async function loadClubGames(teamId: string): Promise<GameRef[]> {
  const [results, fixtures] = await Promise.all([
    loadEvents(`${SITE_API}/all/teams/${teamId}/schedule`),
    loadEvents(`${SITE_API}/all/teams/${teamId}/schedule?fixture=true`),
  ]);
  const byId = new Map<string, GameRef>();
  for (const e of [...results, ...fixtures]) {
    const g = mapClubEvent(e);
    if (g) byId.set(g.id, g);
  }
  return [...byId.values()].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
}

export interface Athlete {
  id: string;
  name: string;
  position: string | null;
  teamId: string | null;
  teamName: string | null;
}

async function loadAthlete(id: string): Promise<Athlete> {
  const json = await fetchJson<{
    athlete?: {
      id?: string;
      displayName?: string;
      position?: { abbreviation?: string };
      team?: { id?: string; displayName?: string; slug?: string; isAllStar?: boolean };
    };
  }>(`${WEB_API}/athletes/${id}`);
  const a = json.athlete;
  if (!a?.id || String(a.id) !== id) throw new Error(`ESPN athlete ${id}: unexpected format`);
  let teamId = a.team?.id ? String(a.team.id) : null;
  let teamName = a.team?.displayName ?? null;
  // ESPN setzt nach einem All-Star-Spiel teils die Auswahl (z. B. "MLS All-Stars") als
  // Profil-Team. Dann den Stammverein aus dem Team-Filter des Gamelogs nehmen.
  if (a.team && (a.team.isAllStar || /all-?stars?/i.test(`${a.team.slug ?? ""} ${a.team.displayName ?? ""}`))) {
    const club = await loadGamelogClub(id).catch(() => null);
    if (club) {
      teamId = club.id;
      teamName = club.name;
    } else {
      teamId = null;
      teamName = null;
    }
  }
  return {
    id,
    name: a.displayName ?? id,
    position: a.position?.abbreviation ?? null,
    teamId,
    teamName,
  };
}

/** Aktueller Verein laut ESPN-Gamelog (Team-Filter), ohne Nationalteams. */
async function loadGamelogClub(id: string): Promise<{ id: string; name: string } | null> {
  const json = await fetchJson<{
    filters?: { name?: string; value?: string; options?: { value?: string; displayValue?: string }[] }[];
  }>(`${WEB_API}/athletes/${id}/gamelog`);
  const f = json.filters?.find((x) => x.name === "team");
  const opt = f?.options?.find((o) => o.value === f.value);
  if (!f?.value || !opt?.displayValue) return null;
  if (/croatia|kroatien|hrvatska|all-?stars?/i.test(opt.displayValue)) return null;
  return { id: String(f.value), name: opt.displayValue };
}

function hnlGame(m: HnlMatch): GameRef | null {
  if (!m.kickoff) return null;
  const state: MatchState =
    m.state === "finished" ? "post" : m.state === "live" ? "in" : m.state === "postponed" ? "postponed" : "pre";
  return {
    source: "tsdb",
    id: m.id,
    kickoff: m.kickoff,
    home: m.home,
    away: m.away,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    state,
    competition: "SuperSport HNL",
    isNationalTeam: false,
  };
}

const ymd = (iso: string) => iso.slice(0, 10);

/* ------------------------------------------------------------------ */

export async function getPlayers(now = Date.now()): Promise<PlayersData | null> {
  try {
    return await loadPlayers(now);
  } catch (err) {
    console.error("[data] players failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

export type SummaryFn = (
  slug: string,
  eventId: string,
  kickoff: string,
  finished: boolean
) => Promise<Sourced<MatchSummary> | null>;

/** Gemeinsame Basis für Spielerseite, Legionäre und Europacup (alle Quellen gecacht). */
export interface SquadBase {
  ntGames: GameRef[];
  finishedNt: GameRef[];
  windowGames: GameRef[];
  windowStart: number;
  windowEnd: number;
  /** ESPN-Athleten-ID → ESPN-Name (Spieltagskader der letzten Länderspielphase) */
  squad: Map<string, string>;
  ids: string[];
  athleteById: Map<string, Athlete>;
  teamIds: string[];
  clubGames: Map<string, GameRef[]>;
  hnlMatches: HnlMatch[] | null;
  summary: SummaryFn;
  fetchedAts: string[];
  gaps: string[];
}

export async function loadSquadBase(now: number, opts: { withHnl?: boolean } = {}): Promise<SquadBase> {
  const fetchedAts: string[] = [];
  const gaps: string[] = [];
  const summaryMemo = new Map<string, Promise<Sourced<MatchSummary> | null>>();

  /** Spielbericht – abgeschlossene Spiele 24 h, sonst 5 min gecacht. */
  const summary = (slug: string, eventId: string, kickoff: string, finished: boolean) => {
    const final = finished && Date.parse(kickoff) + 6 * H < now;
    const key = `${eventId}:${final}`;
    let p = summaryMemo.get(key);
    if (!p) {
      p = cachedSource(
        ["players", "summary2", eventId, final ? "final" : "near"],
        final ? PLAYER_REVALIDATE.final : PLAYER_REVALIDATE.near,
        () => loadSummary(slug, eventId)
      );
      summaryMemo.set(key, p);
    }
    return p;
  };

  // 1) Länderspiele (Kroatien)
  const nt = await adaptive(
    ["players", "nt"],
    loadEspnCroatiaMatches,
    (d) => d.matches.map((m) => m.kickoff),
    now
  );
  if (!nt) throw new Error("ESPN Croatia schedule unavailable");
  fetchedAts.push(nt.fetchedAt);
  const slugOf = new Map(nt.data.raw.map((r) => [`espn-${r.id}`, r.slug]));
  const ntGames: GameRef[] = nt.data.matches
    .filter((m) => slugOf.get(m.id))
    .map((m) => ({
      source: "espn" as const,
      id: m.id.replace(/^espn-/, ""),
      slug: slugOf.get(m.id),
      kickoff: m.kickoff,
      home: m.home,
      away: m.away,
      homeId: m.croatiaIsHome ? ESPN_CROATIA_ID : undefined,
      awayId: m.croatiaIsHome ? undefined : ESPN_CROATIA_ID,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      extra: m.extra,
      state: m.state,
      competition: m.competition,
      isNationalTeam: true,
    }));

  // 2) Kader = Spieltagskader der letzten Länderspielphase
  const finishedNt = ntGames
    .filter((g) => g.state === "post" && Date.parse(g.kickoff) <= now)
    .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff));
  if (finishedNt.length === 0) throw new Error("no finished Croatia match");
  const lastNtTime = Date.parse(finishedNt[0].kickoff);
  const windowGames = finishedNt.filter((g) => Date.parse(g.kickoff) >= lastNtTime - WINDOW_DAYS * 24 * H);
  const windowSummaries = await mapLimit(windowGames, 4, (g) =>
    summary(g.slug!, g.id, g.kickoff, true)
  );
  const squad = new Map<string, string>(); // id → ESPN-Name
  windowSummaries.forEach((s) => {
    for (const p of s?.data.rosters[ESPN_CROATIA_ID] ?? []) if (!squad.has(p.id)) squad.set(p.id, p.name);
  });
  if (squad.size < 15) throw new Error(`squad too small (${squad.size})`);
  const missingWindow = windowGames.filter((_, i) => !windowSummaries[i]);
  if (missingWindow.length) gaps.push(`${missingWindow.length} Länderspielbericht(e) derzeit nicht abrufbar – Kader evtl. unvollständig.`);
  const windowStart = Date.parse(windowGames[windowGames.length - 1].kickoff);
  const windowEnd = lastNtTime;

  // 3) Athleten → Verein (ID-basiert)
  const ids = [...squad.keys()];
  const athletes = await mapLimit(ids, 6, (id) =>
    cachedSource(["players", "athlete-v2", id], PLAYER_REVALIDATE.athlete, () => loadAthlete(id))
  );
  const athleteById = new Map<string, Athlete>();
  athletes.forEach((a, i) => {
    if (a) athleteById.set(ids[i], a.data);
    else gaps.push(`Vereinsdaten für ${PLAYER_NAME[ids[i]] ?? squad.get(ids[i])} derzeit nicht abrufbar.`);
  });

  // 4) Vereinsspielpläne (einmal pro Verein)
  const teamIds = [...new Set([...athleteById.values()].map((a) => a.teamId).filter((t): t is string => !!t))];
  const schedules = await mapLimit(teamIds, 4, (t) =>
    adaptive(["players", "club", t], () => loadClubGames(t), (gs) => gs.map((g) => g.kickoff), now)
  );
  const clubGames = new Map<string, GameRef[]>();
  schedules.forEach((s, i) => {
    if (s) {
      clubGames.set(teamIds[i], s.data);
      fetchedAts.push(s.fetchedAt);
    }
  });

  // 4b) Wettbewerbs-Spielpläne ergänzen: ESPN-Teamspielpläne sind teils lückenhaft
  //     (z. B. fehlende Pokal-/Ligaspiele). Deshalb zusätzlich die Monats-Scoreboards
  //     aller Wettbewerbe, in denen die Vereine zuletzt/demnächst spielen.
  const slugs = new Set<string>();
  for (const gs of clubGames.values())
    for (const g of gs)
      if (g.slug && Math.abs(Date.parse(g.kickoff) - now) <= 150 * 24 * H) slugs.add(g.slug);
  const monthsAhead = [-1, 0, 1].map((i) => {
    const d = new Date(now);
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1));
    return `${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, "0")}`;
  });
  const jobs = [...slugs].flatMap((slug) => monthsAhead.map((m) => ({ slug, m })));
  const boards = await mapLimit(jobs, 4, ({ slug, m }) =>
    cachedSource(["players", "board", slug, m], PLAYER_REVALIDATE.base, async () => {
      const evs = await loadEvents(`${SITE_API}/${slug}/scoreboard?dates=${m}`);
      return evs.map((e) => mapClubEvent({ ...e, league: { ...(e.league ?? {}), slug } })).filter((g): g is GameRef => !!g);
    })
  );
  const teamSet = new Set(clubGames.keys());
  let added = 0;
  for (const b of boards) {
    for (const g of b?.data ?? []) {
      for (const tid of [g.homeId, g.awayId]) {
        if (!tid || !teamSet.has(tid)) continue;
        const list = clubGames.get(tid)!;
        const i = list.findIndex((x) => x.id === g.id);
        if (i === -1) {
          list.push(g);
          added++;
        } else if (list[i].state === "pre" && g.state !== "pre") list[i] = g; // aktuellerer Stand
      }
    }
  }
  if (added) for (const list of clubGames.values()) list.sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));

  // HNL-Ligaspiele (nicht bei ESPN) über TheSportsDB
  let hnlMatches: HnlMatch[] | null = null;
  if (opts.withHnl !== false && teamIds.some((t) => ESPN_TEAM_TO_HNL[t])) {
    const hnl = await getHnl();
    if (hnl) {
      hnlMatches = hnl.data.matches;
      fetchedAts.push(hnl.fetchedAt);
    } else gaps.push("HNL-Spielplan (TheSportsDB) derzeit nicht abrufbar.");
  }

  return {
    ntGames,
    finishedNt,
    windowGames,
    windowStart,
    windowEnd,
    squad,
    ids,
    athleteById,
    teamIds,
    clubGames,
    hnlMatches,
    summary,
    fetchedAts,
    gaps,
  };
}

async function loadPlayers(now: number): Promise<PlayersData> {
  const {
    ntGames,
    finishedNt,
    windowGames,
    windowStart,
    windowEnd,
    squad,
    ids,
    athleteById,
    teamIds,
    clubGames,
    hnlMatches,
    summary,
    fetchedAts,
    gaps,
  } = await loadSquadBase(now, { withHnl: true });

  // 5) Pro Spieler
  const players = await mapLimit(ids, 4, async (id): Promise<PlayerRow> => {
    const athlete = athleteById.get(id) ?? null;
    const teamId = athlete?.teamId ?? null;
    const name = PLAYER_NAME[id] ?? athlete?.name ?? squad.get(id) ?? id;
    const notes: PlayerNote[] = [];
    const games: PlayerGame[] = [];

    // Letztes Länderspiel (Spieler war in dieser Phase im Kader)
    const lastNt = finishedNt[0];
    const ntSummary = await summary(lastNt.slug!, lastNt.id, lastNt.kickoff, true);
    const ntPerf = ntSummary ? performanceOf(ntSummary.data, ESPN_CROATIA_ID, id) : null;
    games.push({
      game: lastNt,
      isHome: lastNt.homeId === ESPN_CROATIA_ID,
      perf: ntPerf && ntPerf.rosterAvailable ? ntPerf : null,
      perfNote: ntSummary ? undefined : "Spielbericht derzeit nicht abrufbar",
    });
    if (ntPerf?.red) {
      notes.push({
        kind: "warn",
        text: `Rote Karte im letzten Länderspiel (${ntPerf.red}) – nach UEFA-Regeln automatisch mind. 1 Spiel Sperre im nächsten Pflicht-Länderspiel (Regelwerk, keine offizielle Meldung).`,
      });
    }

    // Vereinsspiele
    let club: string | null = athlete?.teamName ? clubDe(athlete.teamName) : null;
    let cGames: GameRef[] = [];
    let clubDataMissing = false;
    if (teamId) {
      const espnGames = clubGames.get(teamId);
      if (espnGames) cGames = [...espnGames];
      else clubDataMissing = true;
      const hnlName = ESPN_TEAM_TO_HNL[teamId];
      if (hnlName) {
        club = hnlName;
        if (hnlMatches) {
          for (const m of hnlMatches) {
            if (m.home !== hnlName && m.away !== hnlName) continue;
            const g = hnlGame(m);
            if (g) cGames.push(g);
          }
        }
      }
      cGames.sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
    }
    const isHomeFor = (g: GameRef) =>
      g.source === "espn" ? g.homeId === teamId : g.home === ESPN_TEAM_TO_HNL[teamId ?? ""];

    const lastClub = [...cGames]
      .reverse()
      .find((g) => g.state === "post" && g.homeScore != null && Date.parse(g.kickoff) <= now);
    if (lastClub && teamId) {
      let perf: Performance | null = null;
      let perfNote: string | undefined;
      if (lastClub.source === "espn") {
        const s = await summary(lastClub.slug!, lastClub.id, lastClub.kickoff, true);
        if (s) {
          const p = performanceOf(s.data, teamId, id);
          if (p.rosterAvailable) perf = p;
          else perfNote = "ESPN hat für dieses Spiel keine Aufstellung";
        } else perfNote = "Spielbericht derzeit nicht abrufbar";
      } else perfNote = "Für die HNL gibt es keine freie Quelle mit Spielerdaten";
      games.push({ game: lastClub, isHome: isHomeFor(lastClub), perf, perfNote });

      if (perf?.red) {
        notes.push({
          kind: "warn",
          text: `Rote Karte im letzten Vereinsspiel (${lastClub.competition}, ${perf.red}) – automatische Sperre im selben Wettbewerb laut Regelwerk wahrscheinlich; keine offizielle Sperrmeldung verfügbar.`,
        });
      }
      if (perf && !perf.inSquad) {
        const t = Date.parse(lastClub.kickoff);
        const duringWindow = t >= windowStart - 6 * 24 * H && t <= windowEnd + 24 * H;
        notes.push({
          kind: "info",
          text: `Im letzten Vereinsspiel nicht im Spieltagskader${
            duringWindow ? " (Spiel fiel in die Länderspielphase)" : " (Grund laut Quelle unbekannt)"
          }.`,
        });
      }
    }
    games.sort((a, b) => Date.parse(b.game.kickoff) - Date.parse(a.game.kickoff));

    // Formkurve: letzte 5 abgeschlossene Pflichtspiele (Verein + Kroatien, ab Kaderphase)
    const pastNt = finishedNt.filter((g) => Date.parse(g.kickoff) >= windowStart - 60 * 24 * H);
    const pastClub = cGames.filter((g) => g.state === "post" && g.homeScore != null && Date.parse(g.kickoff) <= now);
    const last5 = [...pastNt, ...pastClub]
      .filter((g, i, arr) => arr.findIndex((x) => x.source === g.source && x.id === g.id) === i)
      .sort((a, b) => Date.parse(b.kickoff) - Date.parse(a.kickoff))
      .slice(0, 5)
      .reverse();
    const form: FormPoint[] = await Promise.all(
      last5.map(async (g) => {
        const side = g.isNationalTeam ? ESPN_CROATIA_ID : teamId;
        const isHome = g.isNationalTeam ? g.homeId === ESPN_CROATIA_ID : isHomeFor(g);
        const opp = isHome ? g.away : g.home;
        const base = { kickoff: g.kickoff, label: `${opp} (${g.competition})`, isNationalTeam: g.isNationalTeam };
        if (g.source !== "espn" || !side) return { ...base, minutes: null, played: null, goals: null, assists: null, ownGoalMinutes: [], penMissMinutes: [], redMinute: null };
        const s = await summary(g.slug!, g.id, g.kickoff, true);
        const p = s ? performanceOf(s.data, side, id) : null;
        if (!p || !p.rosterAvailable) return { ...base, minutes: null, played: null, goals: null, assists: null, ownGoalMinutes: [], penMissMinutes: [], redMinute: null };
        return {
          ...base,
          played: p.played,
          minutes: p.played ? p.minutes : 0,
          goals: p.played ? p.goals : 0,
          assists: p.played ? p.assists ?? 0 : 0,
          ownGoalMinutes: p.ownGoalMinutes,
          penMissMinutes: p.penMissMinutes,
          redMinute: p.red,
        };
      })
    );

    // Nächstes Spiel (Verein oder Kroatien)
    const upcoming = (g: GameRef) =>
      (g.state === "pre" && Date.parse(g.kickoff) >= now - 3 * H) || g.state === "in";
    const nextClub = cGames.find(upcoming) ?? null;
    const nextNt = ntGames.find(upcoming) ?? null;
    let next: PlayerNext | null = null;
    const pick =
      nextClub && nextNt
        ? Date.parse(nextNt.kickoff) < Date.parse(nextClub.kickoff)
          ? nextNt
          : nextClub
        : nextClub ?? nextNt;
    if (pick) {
      const isNt = pick.isNationalTeam;
      const sideTeam = isNt ? ESPN_CROATIA_ID : teamId;
      const callUpOpen = isNt && Date.parse(pick.kickoff) - windowEnd > 10 * 24 * H;
      let lineup: NextLineup = "pending";
      if (pick.source === "tsdb") lineup = "nodata";
      else if (pick.state === "in" || Date.parse(pick.kickoff) - now <= LINEUP_LOOKAHEAD) {
        const s = await summary(pick.slug!, pick.id, pick.kickoff, false);
        lineup = s && sideTeam ? lineupStatusOf(s.data, sideTeam, id) : "unknown";
      }
      let suspensionHint: string | undefined;
      if (isNt && ntPerf?.red) suspensionHint = "Laut Regelwerk gesperrt (Rote Karte)";
      const lastClubGame = games.find((g) => !g.game.isNationalTeam);
      if (!isNt && lastClubGame?.perf?.red && lastClubGame.game.competition === pick.competition)
        suspensionHint = "Sperre wahrscheinlich (Rote Karte im letzten Spiel dieses Wettbewerbs)";
      next = {
        game: pick,
        isHome: isNt ? pick.homeId === ESPN_CROATIA_ID : isHomeFor(pick),
        lineup,
        callUpOpen,
        suspensionHint,
      };
    }

    if (!athlete) notes.push({ kind: "info", text: "Verein derzeit nicht ermittelbar (ESPN-Profil nicht abrufbar)." });
    else if (clubDataMissing) notes.push({ kind: "info", text: "Vereinsspielplan derzeit nicht abrufbar." });

    return {
      id,
      name,
      position: athlete?.position && POSITION_GROUP[athlete.position] ? athlete.position : "?",
      club,
      games,
      form,
      next,
      notes,
    };
  });

  const surname = (n: string) => n.split(" ").slice(-1)[0];
  players.sort(
    (a, b) =>
      (POSITION_GROUP[a.position]?.order ?? 9) - (POSITION_GROUP[b.position]?.order ?? 9) ||
      surname(a.name).localeCompare(surname(b.name), "hr")
  );

  const missingClubs = teamIds.filter((t) => !clubGames.has(t)).length;
  if (missingClubs) gaps.push(`${missingClubs} Vereinsspielplan/-pläne derzeit nicht abrufbar.`);

  return {
    players,
    window: {
      from: new Date(windowStart).toISOString(),
      to: new Date(windowEnd).toISOString(),
      matches: windowGames.length,
    },
    squadNote: SQUAD_NOTES[ymd(new Date(windowEnd).toISOString())],
    fetchedAt: fetchedAts.sort()[0],
    gaps,
  };
}

