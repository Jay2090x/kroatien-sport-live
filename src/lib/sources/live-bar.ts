import { cachedSource, liveSource, type Sourced } from "../cache";
import { fetchJson } from "../http";
import { mapLimit } from "../async";
import { hnlTeam } from "../names";
import { NBA_PLAYERS } from "../sport-meta";
import { CLUB_COMPETITION_DE, ESPN_TEAM_TO_HNL, PLAYER_NAME, clubDe } from "../players-meta";
import { COMPETITION_DE, ESPN_CROATIA_ID, loadEspnCroatiaMatches, scoreOf, type EspnEvent } from "./espn";
import { LIVE_WINDOW, getLiveOverview, getTicker } from "./live";
import { loadSquadBase } from "./players";
import { nbaInfos, soccerInfos, type PlayerInfo } from "../live-player-info";
import { parseSummary } from "./espn-summary";
import { getOfficialSchedule } from "./hnl-official";
import { getHnl } from "./hnl";

/**
 * Daten für die LIVE-Leiste ganz oben auf jeder Seite.
 *
 * Quellen (alle kostenlos, kein Konto):
 *  - Vatreni: ESPN-Spielbericht (wie der Live-Ticker), nur im Fenster um den Anpfiff
 *  - Europacup + Ligen der Legionäre: ESPN-Scoreboards (Status "in")
 *  - NBA (Zubac, Matković, Hezonja): ESPN-NBA-Scoreboard
 *  - SuperSport HNL: TheSportsDB-Livescore (Free-Key 123) – ESPN führt die HNL nicht
 *
 * Es wird nur angezeigt, was eine Quelle ausdrücklich als "läuft gerade" meldet.
 * Fehlt die Quelle, fehlt der Eintrag – nichts wird geschätzt.
 */

const H = 3600_000;
const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const SB_TTL = 15; // s – Scoreboards/Spielberichte (Kurzzeit-Cache im Speicher, siehe liveSource)

/** ältester Abrufzeitpunkt der Live-Quellen im laufenden getLiveBar-Aufruf */
let oldestAt: number | null = null;
function track<T>(s: Sourced<T> | null): Sourced<T> | null {
  if (s) {
    const t = Date.parse(s.fetchedAt);
    if (oldestAt == null || t < oldestAt) oldestAt = t;
  }
  return s;
}
const EUROPE_SLUGS = ["uefa.champions", "uefa.europa", "uefa.europa.conf"];
const HNL_LEAGUE = "4629";
const TSDB_LIVE = "https://www.thesportsdb.com/api/v1/json/123/livescore.php?s=Soccer";

export type LiveKind = "nt" | "hnl" | "europe" | "league" | "nba";

export interface LiveItem {
  id: string;
  kind: LiveKind;
  /** deutsche Datenbezeichnungen (die API übersetzt auf Wunsch ins Kroatische) */
  competition: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  /** Spielminute, z. B. "67'", "90+3'", NBA "Q3 5:42"; null = unbekannt */
  minute: string | null;
  /** Fußball: läuft die Uhr gerade (nicht Pause/Halbzeit)? Dann darf der Browser die Minute weiterzählen. */
  clockRunning?: boolean;
  halftime: boolean;
  /** Kroaten im Spiel (kurze Namen), leer bei Nationalteam/HNL */
  players: string[];
  /** Farbkreis-Kürzel nur für NBA (ESPN-Abkürzung) */
  abbr?: { home?: string; away?: string };
  /** Quelle für die Spieler-Infos (ESPN-Spielbericht), nur für laufende Spiele */
  ref?: { sport: "soccer" | "nba"; slug: string; eventId: string; sides: string[]; wholeSide?: boolean };
  /** kurze Live-Infos zu den Kroaten (aus echten Spielberichtsdaten abgeleitet) */
  infos?: PlayerInfo[];
}

export interface NextGame {
  kind: "nt" | "hnl";
  competition: string;
  home: string;
  away: string;
  kickoff: string;
}

export interface LiveBarData {
  items: LiveItem[];
  next: NextGame | null;
  fetchedAt: string;
}

/* ---------- Hilfen (rein, testbar) ---------- */

export function minuteOf(display: string | undefined): string | null {
  const nums = (display ?? "").match(/\d+/g) ?? [];
  if (!nums.length) return null;
  return nums.length > 1 ? `${nums[0]}+${nums[1]}'` : `${nums[0]}'`;
}

export function surname(full: string): string {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : full;
}

interface LiveStatus {
  live: boolean;
  halftime: boolean;
}
export function liveStatus(e: EspnEvent): LiveStatus {
  const st = e.competitions?.[0]?.status;
  const name = (st?.type?.name ?? "").toUpperCase();
  const live = st?.type?.state === "in" && !st.type.completed;
  return { live, halftime: live && name.includes("HALFTIME") };
}

const NBA_PERIOD = (p: number | undefined) => (!p ? "" : p <= 4 ? `Q${p}` : p === 5 ? "OT" : `${p - 4}OT`);

/** ESPN-Event → Live-Eintrag, wenn es läuft und ein getrackter Verein beteiligt ist. */
export function itemFromEspn(
  e: EspnEvent,
  slug: string,
  kind: LiveKind,
  tracked: Map<string, string[]>
): LiveItem | null {
  const { live, halftime } = liveStatus(e);
  if (!live) return null;
  const c = e.competitions?.[0];
  const home = c?.competitors?.find((x) => x.homeAway === "home");
  const away = c?.competitors?.find((x) => x.homeAway === "away");
  if (!home?.team?.id || !away?.team?.id) return null;
  const hs = scoreOf(home);
  const as = scoreOf(away);
  if (hs == null || as == null) return null;
  const sides = [home.team.id, away.team.id].filter((t) => tracked.has(t));
  if (!sides.length) return null;
  const players = [...new Set(sides.flatMap((t) => tracked.get(t) ?? []))];
  const nba = kind === "nba";
  const st = c?.status;
  const minute = nba
    ? [NBA_PERIOD(st?.period), st?.displayClock].filter(Boolean).join(" ") || null
    : minuteOf(st?.displayClock);
  const team = (x: typeof home) => {
    const n = x.team?.displayName ?? "?";
    return nba ? n : clubDe(n);
  };
  const abbrOf = (x: typeof home) => x.team?.abbreviation;
  return {
    id: `${slug}-${e.id}`,
    kind,
    competition: nba ? "NBA" : CLUB_COMPETITION_DE[slug] || COMPETITION_DE[slug] || e.league?.name || "Pflichtspiel",
    home: team(home),
    away: team(away),
    homeScore: hs,
    awayScore: as,
    minute: halftime ? null : minute,
    clockRunning: !nba && !halftime && minute != null,
    halftime,
    players,
    abbr: nba ? { home: abbrOf(home), away: abbrOf(away) } : undefined,
    ref: { sport: nba ? "nba" : "soccer", slug: nba ? "nba" : slug, eventId: e.id, sides },
  };
}

interface TsdbLive {
  idEvent?: string;
  idLeague?: string;
  strHomeTeam?: string;
  strAwayTeam?: string;
  intHomeScore?: string | null;
  intAwayScore?: string | null;
  strStatus?: string | null;
  strProgress?: string | null;
  strTimestamp?: string | null;
}

const TSDB_PLAYING = new Set(["1H", "2H", "HT", "ET", "BT", "P", "PEN"]);

/** TheSportsDB-Livescore → SuperSport-HNL-Spiele, die gerade laufen (Zeitstempel-Plausibilität: Anpfiff vor max. 3 h). */
export function hnlFromLivescore(rows: TsdbLive[], now: number): LiveItem[] {
  const out: LiveItem[] = [];
  for (const r of rows) {
    if (r.idLeague !== HNL_LEAGUE) continue;
    const status = (r.strStatus ?? "").toUpperCase().trim();
    if (!TSDB_PLAYING.has(status)) continue;
    const kick = r.strTimestamp ? Date.parse(`${r.strTimestamp.replace(/Z$/, "")}Z`) : NaN;
    if (!Number.isFinite(kick) || kick > now + 5 * 60_000 || now - kick > 3 * H) continue;
    const hs = r.intHomeScore != null && r.intHomeScore !== "" ? Number(r.intHomeScore) : NaN;
    const as = r.intAwayScore != null && r.intAwayScore !== "" ? Number(r.intAwayScore) : NaN;
    if (!Number.isFinite(hs) || !Number.isFinite(as) || !r.strHomeTeam || !r.strAwayTeam) continue;
    const halftime = status === "HT";
    const prog = r.strProgress && /^\d/.test(r.strProgress) ? minuteOf(r.strProgress) : null;
    out.push({
      id: `hnl-${r.idEvent}`,
      kind: "hnl",
      competition: "SuperSport HNL",
      home: hnlTeam(r.strHomeTeam),
      away: hnlTeam(r.strAwayTeam),
      homeScore: hs,
      awayScore: as,
      minute: halftime ? null : prog,
      clockRunning: !halftime && prog != null && ["1H", "2H", "ET"].includes(status),
      halftime,
      players: [],
    });
  }
  return out;
}

const KIND_ORDER: Record<LiveKind, number> = { nt: 0, hnl: 1, europe: 2, league: 3, nba: 4 };

/* ---------- Quellen ---------- */

interface Tracked {
  /** ESPN-Team-ID → kroatische Spieler (Kurzname) bzw. [] bei kroatischen Vereinen */
  soccer: Map<string, string[]>;
  slugs: string[];
  /** ESPN-Athleten-ID → Kurzname der Kroaten im Kader */
  croatById: Map<string, string>;
}

/** Kroaten im Nationalkader + ihre Vereine; 30 min gecacht (Basis wird auch von der Spielerseite genutzt). */
export async function trackedSoccer(now: number): Promise<Tracked> {
  const soccer = new Map<string, string[]>();
  for (const t of Object.keys(ESPN_TEAM_TO_HNL)) soccer.set(t, []);
  const slugs = new Set(EUROPE_SLUGS);
  const croatById = new Map<string, string>();
  try {
    const b = await loadSquadBase(now, { withHnl: false });
    for (const id of b.ids) {
      const a = b.athleteById.get(id);
      if (!a?.teamId) continue;
      const n = surname(PLAYER_NAME[id] ?? a.name);
      soccer.set(a.teamId, [...(soccer.get(a.teamId) ?? []), n]);
      croatById.set(id, n);
    }
    for (const [t, gs] of b.clubGames)
      if (soccer.has(t))
        for (const g of gs)
          if (g.slug && !/^(uefa|fifa)\./.test(g.slug) && Math.abs(Date.parse(g.kickoff) - now) <= 60 * 24 * H) slugs.add(g.slug);
  } catch (err) {
    console.error("[data] live-bar squad failed:", err instanceof Error ? err.message : err);
  }
  return { soccer, slugs: [...slugs], croatById };
}

async function nbaTracked(): Promise<Map<string, string[]>> {
  const m = new Map<string, string[]>();
  await mapLimit(NBA_PLAYERS, 3, async (p) => {
    const a = await cachedSource(["livebar", "nba-athlete", p.espnId], 6 * 3600, async () => {
      const j = await fetchJson<{ athlete?: { team?: { id?: string } } }>(
        `https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba/athletes/${p.espnId}`
      );
      if (!j.athlete?.team?.id) throw new Error(`ESPN NBA athlete ${p.espnId}: no team`);
      return String(j.athlete.team.id);
    });
    if (a) m.set(a.data, [...(m.get(a.data) ?? []), surname(p.name)]);
  });
  return m;
}

const ymdUtc = (t: number) => new Date(t).toISOString().slice(0, 10).replace(/-/g, "");

async function scoreboard(path: string, dates: string | null): Promise<EspnEvent[]> {
  const url = `${ESPN_BASE}/${path}/scoreboard${dates ? `?dates=${dates}` : ""}`;
  const s = track(await liveSource(["livebar", "sb", path, dates ?? "now"], SB_TTL, async () => {
    const j = await fetchJson<{ events?: EspnEvent[] }>(url, { timeoutMs: 6000, retries: 0 });
    if (!Array.isArray(j.events)) throw new Error(`ESPN scoreboard ${path}: no events`);
    return j.events;
  }));
  return s?.data ?? [];
}

async function soccerLive(tracked: Tracked, now: number): Promise<LiveItem[]> {
  // Tagesgrenze UTC: kurz nach Mitternacht läuft noch der Vortag
  const days = [ymdUtc(now), ...(new Date(now).getUTCHours() < 4 ? [ymdUtc(now - 24 * H)] : [])];
  const jobs = tracked.slugs.flatMap((slug) => days.map((d) => ({ slug, d })));
  const res = await mapLimit(jobs, 5, async ({ slug, d }) => {
    const evs = await scoreboard(`soccer/${slug}`, d);
    const kind: LiveKind = EUROPE_SLUGS.includes(slug) ? "europe" : "league";
    return evs.map((e) => itemFromEspn({ ...e, league: { ...(e.league ?? {}), slug } }, slug, kind, tracked.soccer)).filter((x): x is LiveItem => !!x);
  });
  return res.flat();
}

async function nbaLive(): Promise<LiveItem[]> {
  const tracked = await nbaTracked();
  if (!tracked.size) return [];
  const evs = await scoreboard("basketball/nba", null);
  return evs.map((e) => itemFromEspn(e, "nba", "nba", tracked)).filter((x): x is LiveItem => !!x);
}

async function hnlLive(now: number): Promise<LiveItem[]> {
  const s = track(await liveSource(["livebar", "tsdb-live"], SB_TTL, async () => {
    const j = await fetchJson<{ livescore?: TsdbLive[] | null }>(TSDB_LIVE, { timeoutMs: 3000, retries: 0 });
    if (!("livescore" in j)) throw new Error("TheSportsDB livescore: unexpected format");
    return j.livescore ?? [];
  }));
  return s ? hnlFromLivescore(s.data, now) : [];
}

async function vatreniLive(now: number): Promise<LiveItem[]> {
  const ov = await getLiveOverview(now);
  const t = ov?.active;
  if (!t) return [];
  const k = Date.parse(t.kickoff);
  if (now < k - 10 * 60_000 || now > k + LIVE_WINDOW.after) return [];
  const tk = await getTicker(t.eventId, now);
  if (!tk || tk.state !== "in" || tk.home.score == null || tk.away.score == null) return [];
  if (tk.fetchedAt) track({ data: null, fetchedAt: tk.fetchedAt });
  return [
    {
      id: `nt-${tk.eventId}`,
      kind: "nt",
      competition: tk.competition,
      home: tk.home.name,
      away: tk.away.name,
      homeScore: tk.home.score,
      awayScore: tk.away.score,
      minute: tk.clock === "HT" ? null : minuteOf(tk.clock ?? undefined),
      halftime: tk.clock === "HT",
      clockRunning: tk.clock !== "HT" && minuteOf(tk.clock ?? undefined) != null,
      players: [],
      ref: { sport: "soccer", slug: tk.slug, eventId: tk.eventId, sides: [ESPN_CROATIA_ID], wholeSide: true },
    },
  ];
}

/**
 * Nächstes relevantes Spiel (Vatreni oder SuperSport HNL), nur wenn gerade nichts läuft.
 * Deterministisch: nur Spiele mit Anpfiff in der Zukunft und ohne Ergebnis, nach echtem Anpfiff sortiert.
 * HNL: offizieller Spielplan (hnl.hr); ist er gerade nicht erreichbar, die HNL-Daten (TheSportsDB/Snapshot,
 * dort mit hnl.hr abgeglichen) – damit springt die Anzeige nicht auf ein ganz anderes Spiel.
 */
export async function nextGame(now: number): Promise<NextGame | null> {
  const cands: NextGame[] = [];
  const future = (k: string | null | undefined): k is string => !!k && Number.isFinite(Date.parse(k)) && Date.parse(k) > now;
  const nt = await cachedSource(["nt", "espn"], 600, loadEspnCroatiaMatches).catch(() => null);
  for (const m of nt?.data.matches ?? [])
    if (m.state === "pre" && future(m.kickoff)) cands.push({ kind: "nt", competition: m.competition, home: m.home, away: m.away, kickoff: m.kickoff });
  const off = await getOfficialSchedule().catch(() => null);
  const offNext = (off ?? []).filter((o) => future(o.kickoff) && o.homeScore == null && o.awayScore == null);
  if (offNext.length) {
    for (const o of offNext) cands.push({ kind: "hnl", competition: "SuperSport HNL", home: o.home, away: o.away, kickoff: o.kickoff! });
  } else {
    const h = await getHnl(now).catch(() => null);
    for (const m of h?.data.matches ?? [])
      if (m.state === "scheduled" && m.homeScore == null && future(m.kickoff))
        cands.push({ kind: "hnl", competition: "SuperSport HNL", home: m.home, away: m.away, kickoff: m.kickoff });
  }
  cands.sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff) || a.home.localeCompare(b.home));
  return cands[0] ?? null;
}

const nbaCroats = new Map(NBA_PLAYERS.map((p) => [p.espnId, surname(p.name)]));

/** Spieler-Infos für ein laufendes Spiel: 1 Spielbericht-Abruf, 45 s gecacht; bei Fehler: keine Infos. */
async function infosFor(item: LiveItem, croatById: Map<string, string>): Promise<PlayerInfo[]> {
  const r = item.ref;
  if (!r) return [];
  const nba = r.sport === "nba";
  const url = `${ESPN_BASE}/${nba ? "basketball/nba" : `soccer/${r.slug}`}/summary?event=${r.eventId}`;
  const s = await liveSource(["livebar", "pinfo2", r.sport, r.eventId], SB_TTL, async () => {
    const j = await fetchJson<Record<string, unknown>>(url, { timeoutMs: 5000, retries: 0 });
    if (!j.header) throw new Error(`ESPN summary ${r.eventId}: unexpected format`);
    if (nba) return nbaInfos(j as Parameters<typeof nbaInfos>[0], nbaCroats);
    const sum = parseSummary(j as Parameters<typeof parseSummary>[0]);
    return r.wholeSide
      ? soccerInfos(sum, r.sides, null, (id, display) => surname(PLAYER_NAME[id] ?? display))
      : soccerInfos(sum, r.sides, croatById);
  });
  return s?.data ?? [];
}

/** Spieler-Infos nur für die angezeigten, gerade laufenden Spiele (je 1 gecachter Abruf). */
export async function attachInfos(items: LiveItem[], croatById: Map<string, string>): Promise<void> {
  await mapLimit(items, 4, async (i) => {
    try {
      const infos = await infosFor(i, croatById);
      if (infos.length) i.infos = infos;
    } catch (err) {
      console.error("[data] live-bar infos failed:", err instanceof Error ? err.message : err);
    }
  });
}

/** Nur für lokale Tests mit LIVE_BAR_FIXTURE_JSON: Infos aus echten Spielberichten für Fixture-Spiele mit `ref`. */
export async function attachInfosForFixture(items: LiveItem[]): Promise<void> {
  const tracked = await trackedSoccer(Date.now());
  await attachInfos(items.filter((i) => i.ref), tracked.croatById);
}

const settled = async <T>(p: Promise<T[]>, what: string): Promise<T[]> => {
  try {
    return await p;
  } catch (err) {
    console.error(`[data] live-bar ${what} failed:`, err instanceof Error ? err.message : err);
    return [];
  }
};

export async function getLiveBar(now = Date.now()): Promise<LiveBarData> {
  oldestAt = null;
  const tracked = await trackedSoccer(now);
  const [nt, hnl, soccer, nba] = await Promise.all([
    settled(vatreniLive(now), "vatreni"),
    settled(hnlLive(now), "hnl"),
    settled(soccerLive(tracked, now), "soccer"),
    settled(nbaLive(), "nba"),
  ]);
  const seen = new Set<string>();
  const items = [...nt, ...hnl, ...soccer, ...nba]
    .filter((i) => (seen.has(i.id) ? false : (seen.add(i.id), true)))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.players.length - a.players.length)
    .slice(0, 8);
  await attachInfos(items, tracked.croatById);
  const next = items.length ? null : await nextGame(now).catch(() => null);
  // ehrlicher Zeitstempel: Abruf der ältesten verwendeten Live-Quelle
  const at = oldestAt != null ? Math.min(oldestAt, Date.now()) : now;
  return { items, next, fetchedAt: new Date(at).toISOString() };
}

/* ---------- Gemeinsame Live-Quelle für Spielseiten & HNL-Box (gleiche Abrufe wie die LIVE-Leiste) ---------- */

/** Rohes Scoreboard-Event – exakt derselbe Abruf/Cache wie die LIVE-Leiste, damit Leiste und Spielseite nie auseinanderlaufen. */
export async function scoreboardEvent(sport: "soccer" | "nba", league: string, id: string, now = Date.now()): Promise<EspnEvent | null> {
  if (sport === "nba") return (await scoreboard("basketball/nba", null)).find((e) => e.id === id) ?? null;
  const days = [ymdUtc(now), ...(new Date(now).getUTCHours() < 4 ? [ymdUtc(now - 24 * H)] : [])];
  for (const d of days) {
    const e = (await scoreboard(`soccer/${league}`, d)).find((x) => x.id === id);
    if (e) return e;
  }
  return null;
}

/** TheSportsDB-Livescore (gleicher Cache wie die Leiste), nur HNL-Zeilen */
export async function hnlLivescore(): Promise<TsdbLive[]> {
  const s = await liveSource(["livebar", "tsdb-live"], SB_TTL, async () => {
    const j = await fetchJson<{ livescore?: TsdbLive[] | null }>(TSDB_LIVE, { timeoutMs: 3000, retries: 0 });
    if (!("livescore" in j)) throw new Error("TheSportsDB livescore: unexpected format");
    return j.livescore ?? [];
  });
  return (s?.data ?? []).filter((r) => r.idLeague === HNL_LEAGUE);
}

/** HNL-Daten mit den Live-Ständen der Leiste überlagern (Spielplan/Box zeigen denselben Stand wie die Leiste). */
export async function withHnlLive<T extends { data: { matches: Array<{ id: string; homeScore: number | null; awayScore: number | null; state: string }> } }>(hnl: T | null): Promise<T | null> {
  if (!hnl) return hnl;
  const rows = await hnlLivescore().catch(() => []);
  const byId = new Map(rows.filter((r) => r.idEvent).map((r) => [r.idEvent!, r]));
  if (!byId.size) return hnl;
  const n = (v: string | null | undefined) => (v != null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  const matches = hnl.data.matches.map((m) => {
    const r = byId.get(m.id);
    if (!r) return m;
    const st = (r.strStatus ?? "").toUpperCase().trim();
    const playing = TSDB_PLAYING.has(st);
    const done = ["FT", "AET", "AP", "MATCH FINISHED"].includes(st);
    if (!playing && !done) return m;
    return { ...m, homeScore: n(r.intHomeScore) ?? m.homeScore, awayScore: n(r.intAwayScore) ?? m.awayScore, state: playing ? "live" : "finished" } as typeof m;
  });
  return { ...hnl, data: { ...hnl.data, matches } } as T;
}
