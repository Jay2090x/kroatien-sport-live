import { fetchJson } from "../http";
import { countryDe } from "../names";
import type { GroupRow, GroupTable, MatchState, NtMatch } from "./types";

/**
 * ESPN – öffentliche, inoffizielle JSON-Endpunkte (kein API-Key).
 * Kroatien = Team-ID 477.
 */
export const ESPN_CROATIA_ID = "477";
export const SITE_API = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const STANDINGS_API = "https://site.api.espn.com/apis/v2/sports/soccer";

export const ESPN_URLS = {
  results: `${SITE_API}/all/teams/${ESPN_CROATIA_ID}/schedule`,
  fixtures: `${SITE_API}/all/teams/${ESPN_CROATIA_ID}/schedule?fixture=true`,
  scoreboard: (slug: string, yyyymmdd: string) =>
    `${SITE_API}/${slug}/scoreboard?dates=${yyyymmdd}`,
  nationsStandings: `${STANDINGS_API}/uefa.nations/standings`,
};

export interface EspnScore {
  value?: number;
  displayValue?: string;
}
export interface EspnCompetitor {
  homeAway?: "home" | "away";
  team?: { id?: string; displayName?: string };
  score?: EspnScore | string | number;
  shootoutScore?: number;
}
export interface EspnStatus {
  displayClock?: string;
  type?: { name?: string; state?: string; completed?: boolean; shortDetail?: string };
}
export interface EspnEvent {
  id: string;
  date: string;
  league?: { slug?: string; name?: string };
  season?: { displayName?: string };
  links?: Array<{ href?: string }>;
  competitions?: Array<{
    id?: string;
    venue?: { fullName?: string; address?: { city?: string } };
    status?: EspnStatus;
    competitors?: EspnCompetitor[];
  }>;
}

export const COMPETITION_DE: Record<string, string> = {
  "uefa.nations": "UEFA Nations League",
  "fifa.friendly": "Freundschaftsspiel",
  "fifa.world": "FIFA-Weltmeisterschaft",
  "fifa.worldq.uefa": "WM-Qualifikation",
  "uefa.euro": "UEFA EURO",
  "uefa.euroq": "EM-Qualifikation",
};

export function leagueSlugOf(e: EspnEvent): string | undefined {
  if (e.league?.slug) return e.league.slug;
  for (const l of e.links ?? []) {
    const m = l.href?.match(/leagueAbbrev=([a-z0-9._]+)/i) ?? l.href?.match(/\/league\/([a-z0-9._]+)/i);
    if (m) return m[1];
  }
  return undefined;
}

export function scoreOf(c?: EspnCompetitor): number | null {
  const s = c?.score;
  if (s == null) return null;
  if (typeof s === "number") return s;
  if (typeof s === "string") return s.trim() === "" ? null : Number.isFinite(Number(s)) ? Number(s) : null;
  if (typeof s.value === "number") return s.value;
  if (s.displayValue != null && s.displayValue !== "") {
    const n = Number(s.displayValue);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function stateOf(status?: EspnStatus): MatchState {
  const name = (status?.type?.name ?? "").toUpperCase();
  if (name.includes("POSTPONED") || name.includes("DELAYED")) return "postponed";
  if (name.includes("CANCEL") || name.includes("ABANDON")) return "cancelled";
  const st = status?.type?.state;
  if (st === "in") return "in";
  if (st === "post" || status?.type?.completed) return "post";
  return "pre";
}

export function mapEspnEvent(e: EspnEvent): NtMatch | null {
  const c = e.competitions?.[0];
  const home = c?.competitors?.find((x) => x.homeAway === "home");
  const away = c?.competitors?.find((x) => x.homeAway === "away");
  if (!c || !home?.team?.displayName || !away?.team?.displayName || !e.date) return null;
  const isCroatia = (x: EspnCompetitor) =>
    x.team?.id === ESPN_CROATIA_ID || /croatia/i.test(x.team?.displayName ?? "");
  if (!isCroatia(home) && !isCroatia(away)) return null;

  const state = stateOf(c.status);
  const slug = leagueSlugOf(e);
  const statusName = (c.status?.type?.name ?? "").toUpperCase();
  let extra: string | undefined;
  if (statusName.includes("PEN") && home.shootoutScore != null && away.shootoutScore != null) {
    extra = `n. E. ${home.shootoutScore}:${away.shootoutScore}`;
  } else if (statusName.includes("AET") || statusName.includes("EXTRA")) {
    extra = "n. V.";
  }
  const hasScore = state === "in" || state === "post";
  let clock: string | undefined;
  if (state === "in") {
    clock = statusName.includes("HALFTIME") ? "HZ" : c.status?.displayClock || "live";
  }

  return {
    id: `espn-${e.id}`,
    kickoff: new Date(e.date).toISOString(),
    home: countryDe(home.team.displayName),
    away: countryDe(away.team.displayName),
    croatiaIsHome: isCroatia(home),
    homeScore: hasScore ? scoreOf(home) : null,
    awayScore: hasScore ? scoreOf(away) : null,
    extra,
    state,
    clock,
    competition:
      (slug && COMPETITION_DE[slug]) ||
      e.league?.name ||
      e.season?.displayName?.replace(/^\d{4}(-\d{2,4})?\s+/, "") ||
      "Länderspiel",
    venue: c.venue?.fullName
      ? `${c.venue.fullName}${c.venue.address?.city ? `, ${c.venue.address.city}` : ""}`
      : undefined,
  };
}

export async function loadEvents(url: string): Promise<EspnEvent[]> {
  const json = await fetchJson<{ events?: EspnEvent[] }>(url);
  if (!Array.isArray(json.events)) throw new Error(`ESPN: no events array (${url})`);
  return json.events;
}

/** Alle Kroatien-Spiele (Ergebnisse + angesetzte Spiele), sortiert nach Anstoß. */
export async function loadEspnCroatiaMatches(): Promise<{
  matches: NtMatch[];
  raw: Array<{ id: string; slug?: string; date: string }>;
}> {
  const [results, fixtures] = await Promise.all([
    loadEvents(ESPN_URLS.results),
    loadEvents(ESPN_URLS.fixtures),
  ]);
  const byId = new Map<string, EspnEvent>();
  for (const e of [...results, ...fixtures]) byId.set(e.id, e);
  const raw = [...byId.values()].map((e) => ({ id: e.id, slug: leagueSlugOf(e), date: e.date }));
  const matches = [...byId.values()]
    .map(mapEspnEvent)
    .filter((m): m is NtMatch => m !== null)
    .sort((a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff));
  if (matches.length === 0) throw new Error("ESPN: no Croatia matches");
  return { matches, raw };
}

/** Live-Overlay: Scoreboard des Spieltags (genauer als der Team-Spielplan). */
export async function loadEspnScoreboardMatch(
  slug: string,
  kickoffIso: string,
  eventId: string
): Promise<NtMatch | null> {
  const d = new Date(kickoffIso);
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
  const events = await loadEvents(ESPN_URLS.scoreboard(slug, ymd));
  const ev = events.find((e) => e.id === eventId);
  return ev ? mapEspnEvent({ ...ev, league: ev.league ?? { slug } }) : null;
}

interface EspnStandings {
  children?: Array<{
    name?: string;
    standings?: {
      entries?: Array<{
        team?: { id?: string; displayName?: string };
        stats?: Array<{ name?: string; value?: number; displayValue?: string }>;
      }>;
    };
  }>;
}

/** Nations-League-Gruppe mit Kroatien (oder null, wenn Kroatien nicht dabei ist). */
export async function loadEspnNationsGroup(): Promise<GroupTable | null> {
  const json = await fetchJson<EspnStandings>(ESPN_URLS.nationsStandings);
  if (!Array.isArray(json.children)) throw new Error("ESPN standings: unexpected format");
  const group = json.children.find((g) =>
    g.standings?.entries?.some((e) => e.team?.id === ESPN_CROATIA_ID)
  );
  if (!group?.standings?.entries) return null;
  const rows: GroupRow[] = group.standings.entries.map((e) => {
    const stat = (n: string) => {
      const s = e.stats?.find((x) => x.name === n);
      const v = s?.value ?? Number(s?.displayValue);
      return Number.isFinite(v) ? Number(v) : 0;
    };
    return {
      rank: stat("rank"),
      team: countryDe(e.team?.displayName ?? "?"),
      isCroatia: e.team?.id === ESPN_CROATIA_ID,
      played: stat("gamesPlayed"),
      won: stat("wins"),
      drawn: stat("ties"),
      lost: stat("losses"),
      goalsFor: stat("pointsFor"),
      goalsAgainst: stat("pointsAgainst"),
      points: stat("points"),
    };
  });
  rows.sort((a, b) => a.rank - b.rank || b.points - a.points);
  return {
    title: `UEFA Nations League · ${(group.name ?? "").replace(/^Group/i, "Gruppe")}`.trim(),
    rows,
  };
}
