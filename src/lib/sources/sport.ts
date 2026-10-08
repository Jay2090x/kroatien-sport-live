import { cachedSource, type Sourced } from "../cache";
import { fetchJson, fetchText } from "../http";
import { mapLimit } from "../async";
import { countryDe } from "../names";
import {
  COMPETITION_DE,
  HRT_SPORT_CATEGORIES,
  MMA_FIGHTERS,
  NBA_PLAYERS,
  TOURNAMENTS,
  TSDB_TEAMS,
  type Sport,
} from "../sport-meta";
import { parseRss } from "./rss";

/**
 * "Andere Sportarten" – nur kostenlose Quellen ohne Konto:
 *  - ESPN (MMA-Kampfhistorie, Tennis-Scoreboards ATP/WTA, NBA)
 *  - TheSportsDB Free-Key "123" (nächste Spiele von Nationalteams/Clubs)
 *  - HRT-Sport-RSS (Schlagzeilen, nur Titel + Link)
 * Es wird nichts geschätzt: Ohne angekündigten Termin heißt es
 * "noch kein Kampf/Spiel angekündigt".
 */

const H = 3600_000;
const D = 24 * H;
const ESPN_SITE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_WEB = "https://site.web.api.espn.com/apis/common/v3/sports";
const ESPN_CORE = "https://sports.core.api.espn.com/v2/sports";
const TSDB = "https://www.thesportsdb.com/api/v1/json/123";
const HRT_FEED = "https://feed.hrt.hr/sport/page.xml";

export const SPORT_REVALIDATE = {
  base: 3600, // 1 h
  eventDay: 600, // 10 min, wenn ein Termin in ±3 h liegt
  mma: 3 * 3600,
  tsdb: 3 * 3600,
  athlete: 6 * 3600,
  final: 24 * 3600,
  headlines: 900,
} as const;

export interface SportItem {
  key: string;
  sport: Sport;
  /** kroatische Seite (Athlet/Team) */
  who: string;
  /** Gegner bzw. Paarung */
  vs: string;
  competition: string;
  start: string | null;
  /** false = nur vorläufiger Platzhalter-Termin der Quelle (nicht anzeigen) */
  dateKnown?: boolean;
  timeKnown: boolean;
  state: "pre" | "in" | "post";
  result?: string;
  outcome?: "W" | "L" | "D";
  detail?: string;
  source: string;
}

export interface FighterStatus {
  name: string;
  org: string;
  next: SportItem | null;
  last: SportItem | null;
  fetchedAt: string;
}

export interface Headline {
  title: string;
  url: string;
  sport: Sport | "other";
  publishedAt: string;
}

export interface SportData {
  fighters: FighterStatus[];
  upcoming: SportItem[];
  national: SportItem[];
  results: SportItem[];
  tournaments: typeof TOURNAMENTS;
  headlines: Headline[];
  fetchedAt: string;
  gaps: string[];
}

/* ------------------------------------------------------------------ */
/* Hilfen                                                              */

function near(times: Array<string | null>, now: number): boolean {
  return times.some((t) => {
    if (!t) return false;
    const x = Date.parse(t);
    return x - 3 * H <= now && now <= x + 4 * H;
  });
}

async function adaptive<T>(
  key: string[],
  loader: () => Promise<T>,
  times: (t: T) => Array<string | null>,
  now: number,
  base: number = SPORT_REVALIDATE.base
): Promise<Sourced<T> | null> {
  const b = await cachedSource([...key, "base"], base, loader);
  if (b && near(times(b.data), now)) {
    return (await cachedSource([...key, "near"], SPORT_REVALIDATE.eventDay, loader)) ?? b;
  }
  return b;
}

const idFromHref = (href?: string) => href?.match(/\/id\/(\d+)/)?.[1];
const countryCode = (href?: string) => href?.match(/countries\/\d+\/([a-z]{3})\.png/i)?.[1]?.toLowerCase();

/** ESPN liefert Namen ohne Diakritika – Anzeige-Korrektur per Tennis-ID. */
const TENNIS_NAME: Record<string, string> = {
  "464": "Marin Čilić",
  "1524": "Nikola Mektić",
};
const TENNIS_NAME_BY_ESPN: Record<string, string> = {
  "Donna Vekic": "Donna Vekić",
  "Mate Pavic": "Mate Pavić",
  "Antonia Ruzic": "Antonia Ružić",
  "Lucija Ciric Bagaric": "Lucija Ćirić Bagarić",
  "Borna Coric": "Borna Ćorić",
  "Dino Prizmic": "Dino Prižmić",
  "Petra Marcinko": "Petra Marčinko",
  "Borna Gojo": "Borna Gojo",
};

/* ------------------------------------------------------------------ */
/* MMA (ESPN Core API: eventlog → Kampf → Status)                      */

interface Ref {
  $ref: string;
}
const core = <T>(ref: string) => fetchJson<T>(ref.replace(/^http:/, "https:"));

const METHOD_DE: Record<string, string> = {
  "decision---unanimous": "einstimmige Punktentscheidung",
  "decision---split": "geteilte Punktentscheidung",
  "decision---majority": "Mehrheitsentscheidung",
  kotko: "K.o./TKO",
  submission: "Aufgabe (Submission)",
};

async function loadFighter(espnId: string, org: string): Promise<{ next: SportItem | null; last: SportItem | null }> {
  const log = await core<{ events?: { items?: Array<{ event: Ref; competition: Ref; played: boolean }> } }>(
    `${ESPN_CORE}/mma/athletes/${espnId}/eventlog?limit=50`
  );
  const items = log.events?.items;
  if (!Array.isArray(items)) throw new Error(`ESPN MMA eventlog ${espnId}: unexpected format`);

  const detail = async (it: { event: Ref; competition: Ref; played: boolean }): Promise<SportItem> => {
    const [ev, comp] = await Promise.all([
      core<{ name?: string; date?: string }>(it.event.$ref),
      core<{
        id: string;
        date?: string;
        status?: Ref;
        competitors?: Array<{ id: string; winner?: boolean; athlete?: Ref }>;
      }>(it.competition.$ref),
    ]);
    const opp = comp.competitors?.find((c) => c.id !== espnId);
    const me = comp.competitors?.find((c) => c.id === espnId);
    const [oppAthlete, status] = await Promise.all([
      opp?.athlete ? core<{ displayName?: string }>(opp.athlete.$ref) : Promise.resolve(null),
      comp.status
        ? core<{
            type?: { state?: string; completed?: boolean };
            period?: number;
            displayClock?: string;
            result?: { name?: string; displayName?: string };
          }>(comp.status.$ref)
        : Promise.resolve(null),
    ]);
    const state = status?.type?.completed ? "post" : status?.type?.state === "in" ? "in" : "pre";
    let result: string | undefined;
    let outcome: SportItem["outcome"];
    if (state === "post") {
      outcome = me?.winner ? "W" : opp?.winner ? "L" : "D";
      const method = status?.result?.name
        ? METHOD_DE[status.result.name] ?? status.result.displayName
        : undefined;
      result = [
        outcome === "W" ? "Sieg" : outcome === "L" ? "Niederlage" : "Unentschieden/kein Ergebnis",
        method,
        status?.period ? `Runde ${status.period}${status.displayClock ? `, ${status.displayClock}` : ""}` : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    return {
      key: `mma-${comp.id}`,
      sport: "mma",
      who: "",
      vs: oppAthlete?.displayName ?? "Gegner offen",
      competition: ev.name ?? org,
      start: comp.date ?? ev.date ?? null,
      // ESPN führt bei MMA meist nur die Event-Startzeit, nicht die Kampfzeit
      timeKnown: false,
      state,
      result,
      outcome,
      source: "ESPN",
    };
  };

  const upcoming = items.filter((i) => !i.played);
  const played = items.filter((i) => i.played);
  const nextItems = await Promise.all(upcoming.slice(0, 3).map(detail));
  const next =
    nextItems
      .filter((x) => x.state !== "post")
      .sort((a, b) => Date.parse(a.start ?? "") - Date.parse(b.start ?? ""))[0] ?? null;
  const last = played.length ? await detail(played[0]) : null;
  return { next, last };
}

/* ------------------------------------------------------------------ */
/* Tennis (ESPN-Scoreboards ATP + WTA, Filter: Länderkennung "cro")    */

interface TennisAthlete {
  displayName?: string;
  flag?: { href?: string };
  links?: Array<{ href?: string }>;
}
interface TennisCompetitor {
  id: string;
  winner?: boolean;
  athlete?: TennisAthlete;
  roster?: { displayName?: string; athletes?: TennisAthlete[] };
  linescores?: Array<{ value?: number; tiebreak?: number }>;
}
interface TennisCompetition {
  id: string;
  date?: string;
  timeValid?: boolean;
  status?: { type?: { name?: string; state?: string; completed?: boolean; shortDetail?: string } };
  competitors?: TennisCompetitor[];
  type?: { text?: string };
  round?: { displayName?: string };
}
interface TennisEvent {
  id: string;
  name?: string;
  groupings?: Array<{ competitions?: TennisCompetition[] }>;
}

const TENNIS_TYPE: Record<string, string> = {
  "Men's Singles": "Einzel",
  "Women's Singles": "Einzel",
  "Men's Doubles": "Doppel",
  "Women's Doubles": "Doppel",
  "Mixed Doubles": "Mixed",
};
function roundDe(r?: string): string {
  if (!r) return "";
  const map: Record<string, string> = {
    Final: "Finale",
    Semifinal: "Halbfinale",
    Quarterfinal: "Viertelfinale",
    "Round of 16": "Achtelfinale",
    "Round of 32": "2. Runde",
  };
  if (map[r]) return map[r];
  const m = r.match(/^Round (\d+)$/);
  if (m) return `${m[1]}. Runde`;
  const q = r.match(/^Qualifying (\d+)\w* Round$/);
  if (q) return `Quali ${q[1]}. Runde`;
  return r;
}

function athletesOf(c: TennisCompetitor): TennisAthlete[] {
  return c.athlete ? [c.athlete] : c.roster?.athletes ?? [];
}
const isCro = (a: TennisAthlete) => countryCode(a.flag?.href) === "cro";
function tennisName(a: TennisAthlete): string {
  const id = idFromHref(a.links?.[0]?.href);
  return (id && TENNIS_NAME[id]) || TENNIS_NAME_BY_ESPN[a.displayName ?? ""] || a.displayName || "?";
}
function sideLabel(c: TennisCompetitor): string {
  // Kroatische Spieler zuerst
  return [...athletesOf(c)]
    .sort((a, b) => Number(isCro(b)) - Number(isCro(a)))
    .map((a) => {
      const cc = countryCode(a.flag?.href);
      return `${tennisName(a)}${cc && cc !== "cro" ? ` (${cc.toUpperCase()})` : ""}`;
    })
    .join(" / ");
}

async function loadTennis(): Promise<SportItem[]> {
  // Aktuelle Turniere + Stand von vor 2 Tagen (erfasst kürzlich beendete Turniere)
  const past = new Date(Date.now() - 2 * D).toISOString().slice(0, 10).replace(/-/g, "");
  const urls = ["atp", "wta"].flatMap((t) => [
    `${ESPN_SITE}/tennis/${t}/scoreboard`,
    `${ESPN_SITE}/tennis/${t}/scoreboard?dates=${past}`,
  ]);
  const settled = await Promise.allSettled(urls.map((u) => fetchJson<{ events?: TennisEvent[] }>(u)));
  const boards = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (boards.length === 0) throw new Error("ESPN tennis: unavailable");
  if (boards.every((b) => !Array.isArray(b.events))) throw new Error("ESPN tennis: no events");
  const seen = new Set<string>();
  const out: SportItem[] = [];
  for (const board of boards) {
    for (const ev of board.events ?? []) {
      for (const g of ev.groupings ?? []) {
        for (const c of g.competitions ?? []) {
          if (seen.has(c.id)) continue;
          const comps = c.competitors ?? [];
          const mine = comps.find((x) => athletesOf(x).some(isCro));
          const opp = comps.find((x) => x !== mine);
          if (!mine) continue;
          seen.add(c.id);
          const st = c.status?.type;
          const state: SportItem["state"] = st?.completed || st?.state === "post" ? "post" : st?.state === "in" ? "in" : "pre";
          let result: string | undefined;
          let outcome: SportItem["outcome"];
          if (state !== "pre") {
            const sets = (mine.linescores ?? []).map((ls, i) => {
              const o = opp?.linescores?.[i];
              const a = ls.value ?? 0;
              const b = o?.value ?? 0;
              const hasTb = ls.tiebreak != null && o?.tiebreak != null;
              // Match-Tiebreak (z. B. Doppel 10:6) wird von ESPN als Satz 1:0 geliefert
              if (hasTb && a + b === 1 && Math.max(ls.tiebreak!, o!.tiebreak!) >= 10) return `[${ls.tiebreak}:${o!.tiebreak}]`;
              return `${a}:${b}${hasTb ? ` (${ls.tiebreak}:${o!.tiebreak})` : ""}`;
            });
            result = sets.join(", ");
            if (state === "post") {
              outcome = mine.winner ? "W" : opp?.winner ? "L" : undefined;
              const name = (st?.name ?? "").toUpperCase();
              if (/RETIRED|WALKOVER|ABANDON/.test(name)) result = `${result} (${st?.shortDetail ?? "Aufgabe"})`.trim();
              result = `${outcome === "W" ? "Sieg" : outcome === "L" ? "Niederlage" : "Ende"}${result ? ` · ${result}` : ""}`;
            }
          }
          out.push({
            key: `tennis-${c.id}`,
            sport: "tennis",
            who: sideLabel(mine),
            vs: opp ? sideLabel(opp) : "Gegner offen",
            competition: [ev.name, TENNIS_TYPE[c.type?.text ?? ""] ?? c.type?.text, roundDe(c.round?.displayName)]
              .filter(Boolean)
              .join(" · "),
            start: c.date ? new Date(c.date).toISOString() : null,
            // ESPN-Platzhalter ("TBD") tragen oft ein falsches Datum → nicht anzeigen
            dateKnown: state !== "pre" || Boolean(c.timeValid),
            timeKnown: Boolean(c.timeValid),
            state,
            result,
            outcome,
            source: "ESPN",
          });
        }
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* NBA (ESPN)                                                          */

interface NbaEvent {
  id: string;
  date: string;
  seasonType?: { type?: number };
  competitions?: Array<{
    status?: { type?: { state?: string; completed?: boolean } };
    competitors?: Array<{
      homeAway?: string;
      winner?: boolean;
      team?: { id?: string; displayName?: string };
      score?: { displayValue?: string } | string;
    }>;
  }>;
}

const NBA_SEASON: Record<number, string> = { 1: "NBA-Vorbereitung", 2: "NBA", 3: "NBA-Playoffs", 5: "NBA Play-in" };

async function loadNbaTeam(teamId: string): Promise<NbaEvent[]> {
  const [res, fix] = await Promise.all([
    fetchJson<{ events?: NbaEvent[] }>(`${ESPN_SITE}/basketball/nba/teams/${teamId}/schedule`),
    fetchJson<{ events?: NbaEvent[] }>(`${ESPN_SITE}/basketball/nba/teams/${teamId}/schedule?fixture=true`),
  ]);
  if (!Array.isArray(res.events) && !Array.isArray(fix.events)) throw new Error(`ESPN NBA ${teamId}: no events`);
  const byId = new Map<string, NbaEvent>();
  for (const e of [...(res.events ?? []), ...(fix.events ?? [])]) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

async function loadNbaLine(eventId: string, athleteId: string): Promise<string | null> {
  const json = await fetchJson<{
    boxscore?: {
      players?: Array<{
        statistics?: Array<{
          labels?: string[];
          athletes?: Array<{
            athlete?: { id?: string };
            didNotPlay?: boolean;
            reason?: string;
            stats?: string[];
          }>;
        }>;
      }>;
    };
  }>(`${ESPN_SITE}/basketball/nba/summary?event=${eventId}`);
  for (const t of json.boxscore?.players ?? []) {
    for (const s of t.statistics ?? []) {
      const a = s.athletes?.find((x) => x.athlete?.id === athleteId);
      if (!a) continue;
      if (a.didNotPlay || !a.stats?.length) return "nicht eingesetzt";
      const v = (l: string) => a.stats?.[s.labels?.indexOf(l) ?? -1];
      return `${v("MIN")} Min. · ${v("PTS")} Pkt. · ${v("REB")} Reb. · ${v("AST")} Ass.`;
    }
  }
  return "nicht im Spielberichtsbogen";
}

function nbaItem(e: NbaEvent, teamId: string, who: string): SportItem {
  const c = e.competitions?.[0];
  const home = c?.competitors?.find((x) => x.homeAway === "home");
  const away = c?.competitors?.find((x) => x.homeAway === "away");
  const st = c?.status?.type;
  const state: SportItem["state"] = st?.completed || st?.state === "post" ? "post" : st?.state === "in" ? "in" : "pre";
  const score = (x?: { score?: { displayValue?: string } | string }) =>
    typeof x?.score === "string" ? x.score : x?.score?.displayValue;
  const mine = home?.team?.id === teamId ? home : away;
  return {
    key: `nba-${e.id}-${who}`,
    sport: "basketball",
    who,
    vs: `${home?.team?.displayName ?? "?"} – ${away?.team?.displayName ?? "?"}`,
    competition: NBA_SEASON[e.seasonType?.type ?? 2] ?? "NBA",
    start: new Date(e.date).toISOString(),
    timeKnown: true,
    state,
    result: state === "pre" ? undefined : `${score(home) ?? "–"}:${score(away) ?? "–"}`,
    outcome: state === "post" ? (mine?.winner ? "W" : "L") : undefined,
    source: "ESPN",
  };
}

/* ------------------------------------------------------------------ */
/* TheSportsDB – nächste Spiele                                        */

interface TsdbEvent {
  idEvent: string;
  idHomeTeam?: string;
  idAwayTeam?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  strTimestamp?: string | null;
  dateEvent?: string | null;
  strTime?: string | null;
  strLeague?: string;
  strStatus?: string | null;
  strPostponed?: string | null;
}

function cleanTsdbName(name: string, national: boolean): string {
  const base = name.replace(/\s+(Handball|Basketball)(\s+Women)?$/i, "").trim();
  return national ? countryDe(base) : base;
}

/**
 * Uhrzeiten von TheSportsDB sind bei weit entfernten Terminen oft vorläufig
 * (Beispiel: Polen – Kroatien 27.11.2026: TSDB 18:00, Verband 20:45).
 * Daher zeigen wir die Uhrzeit erst ab 7 Tagen vor dem Termin.
 */
const TSDB_TIME_HORIZON = 7 * D;

async function loadTsdbNext(team: (typeof TSDB_TEAMS)[number]): Promise<SportItem | null> {
  const json = await fetchJson<{ events?: TsdbEvent[] | null }>(`${TSDB}/eventsnext.php?id=${team.id}`, {
    retries: 2,
  });
  const e = (json.events ?? []).find((x) => x.strPostponed !== "yes");
  if (!e) return null;
  let start: string | null = null;
  let timeKnown = false;
  if (e.strTimestamp) {
    start = new Date(`${e.strTimestamp.replace(/Z$/, "")}Z`).toISOString();
    timeKnown = !/T00:00:00/.test(e.strTimestamp);
  } else if (e.dateEvent) {
    start = new Date(`${e.dateEvent}T${e.strTime || "00:00:00"}Z`).toISOString();
    timeKnown = Boolean(e.strTime && e.strTime !== "00:00:00");
  }
  const homeName = e.idHomeTeam === team.id ? team.name : cleanTsdbName(e.strHomeTeam, team.national);
  const awayName = e.idAwayTeam === team.id ? team.name : cleanTsdbName(e.strAwayTeam, team.national);
  return {
    key: `tsdb-${e.idEvent}`,
    sport: team.sport,
    who: team.name,
    vs: `${homeName} – ${awayName}`,
    competition: COMPETITION_DE[e.strLeague ?? ""] ?? e.strLeague ?? "",
    start,
    timeKnown,
    state: "pre",
    source: "TheSportsDB",
  };
}

/* ------------------------------------------------------------------ */
/* HRT-Schlagzeilen (Nicht-Fußball)                                    */

async function loadHeadlines(): Promise<Headline[]> {
  const items = parseRss(await fetchText(HRT_FEED));
  const out: Headline[] = [];
  for (const it of items) {
    let cat = "";
    try {
      cat = new URL(it.link).pathname.split("/").filter(Boolean)[0] ?? "";
    } catch {
      continue;
    }
    const sport = HRT_SPORT_CATEGORIES[cat];
    if (!sport) continue;
    const t = it.pubDate ? Date.parse(it.pubDate) : NaN;
    if (Number.isNaN(t)) continue;
    out.push({ title: it.title, url: it.link, sport, publishedAt: new Date(t).toISOString() });
  }
  if (items.length === 0) throw new Error("HRT: empty feed");
  return out.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/* ------------------------------------------------------------------ */

export async function getSport(now = Date.now()): Promise<SportData | null> {
  try {
    return await loadSport(now);
  } catch (err) {
    console.error("[data] sport failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function loadSport(now: number): Promise<SportData> {
  const fetchedAts: string[] = [];
  const gaps: string[] = [];
  const track = <T>(s: Sourced<T> | null, gap: string): T | null => {
    if (!s) {
      gaps.push(gap);
      return null;
    }
    fetchedAts.push(s.fetchedAt);
    return s.data;
  };

  const [fightersRaw, tennisRaw, nbaRaw, tsdbRaw, headlinesRaw] = await Promise.all([
    mapLimit(MMA_FIGHTERS, 2, async (f) => ({
      f,
      s: await cachedSource(["sport", "mma", f.espnId], SPORT_REVALIDATE.mma, () => loadFighter(f.espnId, f.org)),
    })),
    adaptive(["sport", "tennis"], loadTennis, (items) => items.filter((i) => i.state !== "post").map((i) => i.start), now),
    mapLimit(NBA_PLAYERS, 3, async (p) => {
      const a = await cachedSource(["sport", "nba-athlete", p.espnId], SPORT_REVALIDATE.athlete, async () => {
        const j = await fetchJson<{ athlete?: { team?: { id?: string; displayName?: string }; active?: boolean } }>(
          `${ESPN_WEB}/basketball/nba/athletes/${p.espnId}`
        );
        if (!j.athlete) throw new Error(`ESPN NBA athlete ${p.espnId}: unexpected format`);
        return { teamId: j.athlete.team?.id ?? null, team: j.athlete.team?.displayName ?? null, active: j.athlete.active !== false };
      });
      if (!a?.data.teamId || !a.data.active) return { p, a, games: null };
      const games = await adaptive(["sport", "nba-team", a.data.teamId], () => loadNbaTeam(a.data.teamId!), (es) => es.map((e) => e.date), now);
      return { p, a, games };
    }),
    mapLimit(TSDB_TEAMS, 1, async (t) => ({
      t,
      s: await cachedSource(["sport", "tsdb-next", t.id], SPORT_REVALIDATE.tsdb, () => loadTsdbNext(t)),
    })),
    cachedSource(["sport", "hrt"], SPORT_REVALIDATE.headlines, loadHeadlines),
  ]);

  // MMA
  const fighters: FighterStatus[] = [];
  for (const { f, s } of fightersRaw) {
    const d = track(s, `MMA-Daten für ${f.name} derzeit nicht abrufbar.`);
    if (!d || !s) continue;
    const label = (x: SportItem | null) => (x ? { ...x, who: f.name } : null);
    fighters.push({ name: f.name, org: f.org, next: label(d.next), last: label(d.last), fetchedAt: s.fetchedAt });
  }

  const upcoming: SportItem[] = [];
  const results: SportItem[] = [];
  const national: SportItem[] = [];
  const inWindow = (i: SportItem, ahead: number) => {
    if (!i.start) return false;
    const t = Date.parse(i.start);
    return t >= now - 3 * H && t <= now + ahead;
  };
  const recent = (i: SportItem, back: number) => i.start != null && Date.parse(i.start) >= now - back && Date.parse(i.start) <= now;

  // Tennis
  const tennis = track(tennisRaw, "Tennis (ESPN) derzeit nicht abrufbar.");
  for (const i of tennis ?? []) {
    if (i.state === "post") {
      if (recent(i, 3 * D)) results.push(i);
    } else if (i.state === "in" || inWindow(i, 7 * D)) upcoming.push(i);
  }

  // NBA
  await mapLimit(nbaRaw, 3, async ({ p, a, games }) => {
    if (!a) return void gaps.push(`NBA-Daten für ${p.name} derzeit nicht abrufbar.`);
    fetchedAts.push(a.fetchedAt);
    if (!a.data.active || !a.data.teamId) return;
    const gs = track(games, `NBA-Spielplan für ${p.name} derzeit nicht abrufbar.`);
    if (!gs) return;
    const who = `${p.name} (${a.data.team})`;
    const next = gs.find((e) => nbaItem(e, a.data.teamId!, who).state !== "post" && Date.parse(e.date) >= now - 4 * H);
    if (next) {
      const it = nbaItem(next, a.data.teamId!, who);
      if (it.state === "in" || inWindow(it, 14 * D)) upcoming.push(it);
    }
    const last = [...gs].reverse().find((e) => nbaItem(e, a.data.teamId!, who).state === "post");
    if (last) {
      const it = nbaItem(last, a.data.teamId!, who);
      if (recent(it, 4 * D)) {
        const line = await cachedSource(["sport", "nba-line", last.id, p.espnId], SPORT_REVALIDATE.final, () =>
          loadNbaLine(last.id, p.espnId)
        );
        if (line?.data) it.detail = line.data;
        results.push(it);
      }
    }
  });

  // TheSportsDB – nächste Spiele
  for (const { t, s } of tsdbRaw) {
    const raw = track(s, `Spielplan ${t.name} (${t.sport === "handball" ? "Handball" : "Basketball"}) derzeit nicht abrufbar.`);
    const it = raw ? { ...raw } : null;
    if (!it || !it.start || Date.parse(it.start) < now - 3 * H) continue;
    if (t.national) national.push(it);
    else if (inWindow(it, 14 * D)) upcoming.push(it);
  }
  for (const it of [...national, ...upcoming]) {
    if (it.source === "TheSportsDB" && it.start && Date.parse(it.start) - now > TSDB_TIME_HORIZON) it.timeKnown = false;
  }

  const headlines = (track(headlinesRaw, "HRT-Schlagzeilen derzeit nicht abrufbar.") ?? []).filter(
    (h) => Date.parse(h.publishedAt) >= now - 3 * D
  );

  const byStart = (a: SportItem, b: SportItem) => Date.parse(a.start ?? "") - Date.parse(b.start ?? "");
  // Doppelte (z. B. derselbe Termin aus zwei Quellen) entfernen
  const dedupe = (xs: SportItem[]) => [...new Map(xs.map((x) => [x.key, x])).values()];

  if (fetchedAts.length === 0) throw new Error("no sport source available");
  return {
    fighters,
    upcoming: dedupe(upcoming).sort(byStart).slice(0, 12),
    national: dedupe(national).sort(byStart),
    results: dedupe(results).sort((a, b) => -byStart(a, b)).slice(0, 10),
    tournaments: TOURNAMENTS.filter((t) => Date.parse(`${t.to}T23:59:59Z`) >= now),
    headlines: headlines.slice(0, 8),
    fetchedAt: fetchedAts.sort()[0],
    gaps,
  };
}
