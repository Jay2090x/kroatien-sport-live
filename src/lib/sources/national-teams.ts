import { cachedSource } from "../cache";
import { fetchJson } from "../http";
import { mapLimit } from "../async";
import { countryDe } from "../names";
import { stateOf, scoreOf, type EspnEvent } from "./espn";
import type { GroupRow, GroupTable, MatchState } from "./types";

/**
 * Frauen-Nationalteam und U21 (Kroatien).
 * Spiele + Tabelle: ESPN-Wettbewerbs-Scoreboards (Monatsabfragen) und -Standings.
 * Kader: englische Wikipedia (Abschnitt "Current squad", Quelle dort: HNS).
 * Nichts wird ergänzt oder geschätzt – fehlt etwas, sagt die Seite das.
 */

export type TeamKey = "frauen" | "u21";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const STAND = "https://site.api.espn.com/apis/v2/sports/soccer";

export const TEAM_CONF: Record<
  TeamKey,
  { espnId: string; leagues: string[]; wikiPage: string; wikiUrl: string; strip: RegExp }
> = {
  frauen: {
    espnId: "18889",
    leagues: ["fifa.wworldq.uefa", "uefa.weuro", "uefa.weuroq"],
    wikiPage: "Croatia_women's_national_football_team",
    wikiUrl: "https://en.wikipedia.org/wiki/Croatia_women%27s_national_football_team",
    strip: /\s+Women$/i,
  },
  u21: {
    espnId: "19348",
    leagues: ["uefa.euro_u21_qual", "uefa.euro_u21", "fifa.friendly_u21"],
    wikiPage: "Croatia_national_under-21_football_team",
    wikiUrl: "https://en.wikipedia.org/wiki/Croatia_national_under-21_football_team",
    strip: /\s+U21$/i,
  },
};

export interface TeamEvent {
  kind: "goal" | "penalty" | "owngoal" | "pen-miss" | "yellow" | "red";
  minute: string;
  forCroatia: boolean;
  name: string;
}

export interface TeamMatch {
  id: string;
  kickoff: string;
  home: string;
  away: string;
  croatiaIsHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  state: MatchState;
  competition: string;
  league: string;
  round: string | null;
  venue: string | null;
  events: TeamEvent[];
}

export interface SquadPlayer {
  pos: string;
  name: string;
  caps: number | null;
  goals: number | null;
  club: string | null;
}

export interface TeamData {
  matches: TeamMatch[];
  table: GroupTable | null;
  tableLeague: string | null;
  fetchedAt: string;
  squad: { players: SquadPlayer[]; note: string | null; fetchedAt: string } | null;
  gaps: string[];
}

function months(now: number, back: number, ahead: number): string[] {
  const d = new Date(now);
  const out: string[] = [];
  for (let i = -back; i <= ahead; i++) {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + i, 1));
    out.push(`${x.getUTCFullYear()}${String(x.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

interface RawDetail {
  type?: { text?: string };
  clock?: { displayValue?: string };
  team?: { id?: string };
  ownGoal?: boolean;
  penaltyKick?: boolean;
  athletesInvolved?: Array<{ displayName?: string }>;
}
type RawEvent = EspnEvent & {
  competitions?: Array<NonNullable<EspnEvent["competitions"]>[number] & { details?: RawDetail[]; notes?: Array<{ headline?: string }> }>;
};

function minuteOf(display: string): string {
  const n = display.match(/\d+/g) ?? [];
  return n.length ? (n.length > 1 ? `${n[0]}+${n[1]}'` : `${n[0]}'`) : "";
}

function mapEvent(e: RawEvent, key: TeamKey, leagueName: string, slug: string): TeamMatch | null {
  const conf = TEAM_CONF[key];
  const c = e.competitions?.[0];
  const home = c?.competitors?.find((x) => x.homeAway === "home");
  const away = c?.competitors?.find((x) => x.homeAway === "away");
  if (!c || !home?.team || !away?.team) return null;
  if (home.team.id !== conf.espnId && away.team.id !== conf.espnId) return null;
  const state = stateOf(c.status);
  const scored = state === "in" || state === "post";
  const events: TeamEvent[] = [];
  for (const d of c.details ?? []) {
    const t = (d.type?.text ?? "").toLowerCase();
    let kind: TeamEvent["kind"] | null = null;
    if (d.ownGoal || t.includes("own goal")) kind = "owngoal";
    else if (t.startsWith("penalty - scored")) kind = "penalty";
    else if (t.startsWith("penalty - missed") || t.startsWith("penalty - saved")) kind = "pen-miss";
    else if (t.startsWith("goal")) kind = "goal";
    else if (t.includes("red card")) kind = "red";
    else if (t.includes("yellow card")) kind = "yellow";
    if (!kind) continue;
    events.push({
      kind,
      minute: minuteOf(d.clock?.displayValue ?? ""),
      forCroatia: d.team?.id === conf.espnId,
      name: d.athletesInvolved?.[0]?.displayName ?? "?",
    });
  }
  const clean = (n?: string) => countryDe((n ?? "?").replace(conf.strip, ""));
  const round = (c as { notes?: Array<{ headline?: string }> }).notes?.[0]?.headline ?? null;
  return {
    id: e.id,
    kickoff: new Date(e.date).toISOString(),
    home: clean(home.team.displayName),
    away: clean(away.team.displayName),
    croatiaIsHome: home.team.id === conf.espnId,
    homeScore: scored ? scoreOf(home) : null,
    awayScore: scored ? scoreOf(away) : null,
    state,
    competition: leagueName,
    league: slug,
    round,
    venue: c.venue?.fullName ? `${c.venue.fullName}${c.venue.address?.city ? `, ${c.venue.address.city}` : ""}` : null,
    events,
  };
}

async function loadMatches(key: TeamKey, now: number): Promise<TeamMatch[]> {
  const conf = TEAM_CONF[key];
  const jobs = conf.leagues.flatMap((l) => months(now, 12, 4).map((m) => ({ l, m })));
  let ok = 0;
  const res = await mapLimit(jobs, 4, async ({ l, m }) => {
    try {
      const j = await fetchJson<{ events?: RawEvent[]; leagues?: Array<{ name?: string }> }>(
        `${SITE}/${l}/scoreboard?dates=${m}`,
        { retries: 0 }
      );
      ok++;
      const name = j.leagues?.[0]?.name ?? l;
      return (j.events ?? []).map((e) => mapEvent(e, key, name, l)).filter((x): x is TeamMatch => !!x);
    } catch {
      return [];
    }
  });
  if (ok === 0) throw new Error(`${key}: all ESPN scoreboards failed`);
  const byId = new Map<string, TeamMatch>();
  for (const m of res.flat()) byId.set(m.id, m);
  return [...byId.values()].sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
}

interface RawStandings {
  name?: string;
  children?: Array<{
    name?: string;
    standings?: { entries?: Array<{ team?: { id?: string; displayName?: string }; stats?: Array<{ name?: string; value?: number }> }> };
  }>;
}

async function loadTable(key: TeamKey, league: string): Promise<GroupTable | null> {
  const conf = TEAM_CONF[key];
  const j = await fetchJson<RawStandings>(`${STAND}/${league}/standings`);
  if (!Array.isArray(j.children)) throw new Error(`${league} standings: unexpected format`);
  const g = j.children.find((x) => x.standings?.entries?.some((e) => e.team?.id === conf.espnId));
  if (!g?.standings?.entries) return null;
  const rows: GroupRow[] = g.standings.entries.map((e) => {
    const s = (n: string) => Number(e.stats?.find((x) => x.name === n)?.value ?? 0);
    return {
      rank: s("rank"),
      team: countryDe((e.team?.displayName ?? "?").replace(conf.strip, "")),
      isCroatia: e.team?.id === conf.espnId,
      played: s("gamesPlayed"),
      won: s("wins"),
      drawn: s("ties"),
      lost: s("losses"),
      goalsFor: s("pointsFor"),
      goalsAgainst: s("pointsAgainst"),
      points: s("points"),
    };
  });
  rows.sort((a, b) => a.rank - b.rank);
  return { title: `${j.name ?? league} · ${g.name ?? ""}`.trim(), rows };
}

/* ---- Wikipedia: aktueller Kader ---- */

const WIKI_API = "https://en.wikipedia.org/w/api.php";

function stripWiki(s: string): string {
  return s
    .replace(/\{\{\s*sortname\s*\|([^|}]*)\|([^|}]*)[^}]*\}\}/gi, "$1 $2")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/^:?de:/, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function parseSquad(wikitext: string): { players: SquadPlayer[]; note: string | null } {
  const players: SquadPlayer[] = [];
  for (const line of wikitext.split("\n")) {
    if (!/\{\{\s*nat fs g player/i.test(line)) continue;
    const body = line.replace(/^\s*\{\{\s*nat fs g player\s*\|/i, "").replace(/\}\}\s*$/, "");
    // Felder auf oberster Ebene splitten (Pipes in {{…}}/[[…]] ignorieren)
    const fields: Record<string, string> = {};
    let depth = 0;
    let cur = "";
    const push = () => {
      const i = cur.indexOf("=");
      if (i > 0) fields[cur.slice(0, i).trim().toLowerCase()] = cur.slice(i + 1).trim();
      cur = "";
    };
    for (let i = 0; i < body.length; i++) {
      const two = body.slice(i, i + 2);
      if (two === "{{" || two === "[[") { depth++; cur += two; i++; continue; }
      if (two === "}}" || two === "]]") { depth--; cur += two; i++; continue; }
      if (body[i] === "|" && depth === 0) { push(); continue; }
      cur += body[i];
    }
    push();
    const name = stripWiki(fields.name ?? "");
    if (!name) continue;
    const num = (v?: string) => (v && /^\d+$/.test(v.trim()) ? Number(v.trim()) : null);
    players.push({
      pos: (fields.pos ?? "?").toUpperCase(),
      name,
      caps: num(fields.caps),
      goals: num(fields.goals),
      club: fields.club ? stripWiki(fields.club) || null : null,
    });
  }
  const intro = wikitext.match(/The following players were (?:called up|named)[^\n]*?\./i)?.[0] ?? null;
  return { players, note: intro ? stripWiki(intro.replace(/<ref[\s\S]*?(<\/ref>|\/>)/g, "")) : null };
}

async function loadSquad(key: TeamKey): Promise<{ players: SquadPlayer[]; note: string | null }> {
  const page = TEAM_CONF[key].wikiPage;
  const sec = await fetchJson<{ parse?: { sections?: Array<{ index: string; line: string }> } }>(
    `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=sections&format=json`
  );
  const idx = sec.parse?.sections?.find((s) => /^current squad$/i.test(s.line))?.index;
  if (!idx) throw new Error(`${key}: no current squad section`);
  const wt = await fetchJson<{ parse?: { wikitext?: { "*": string } } }>(
    `${WIKI_API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&section=${idx}&format=json`
  );
  const text = wt.parse?.wikitext?.["*"];
  if (!text) throw new Error(`${key}: empty squad wikitext`);
  const out = parseSquad(text);
  if (out.players.length < 11) throw new Error(`${key}: squad too small (${out.players.length})`);
  return out;
}

export async function getTeam(key: TeamKey, now = Date.now()): Promise<TeamData | null> {
  const m = await cachedSource(["nt2", key, "matches"], 3 * 3600, () => loadMatches(key, now));
  if (!m) return null;
  const gaps: string[] = [];
  // Tabelle: Wettbewerb des nächsten bzw. letzten Spiels
  const ref =
    m.data.find((x) => x.state === "pre" && Date.parse(x.kickoff) > now) ??
    [...m.data].reverse().find((x) => x.state === "post");
  let table: GroupTable | null = null;
  let tableLeague: string | null = null;
  if (ref) {
    const t = await cachedSource(["nt2", key, "table", ref.league], 3 * 3600, () => loadTable(key, ref.league));
    if (t?.data) {
      table = t.data;
      tableLeague = ref.competition;
    }
  }
  if (!table) gaps.push("table");
  const sq = await cachedSource(["nt2", key, "squad"], 12 * 3600, () => loadSquad(key));
  if (!sq) gaps.push("squad");
  return {
    matches: m.data,
    table,
    tableLeague,
    fetchedAt: m.fetchedAt,
    squad: sq ? { ...sq.data, fetchedAt: sq.fetchedAt } : null,
    gaps,
  };
}
