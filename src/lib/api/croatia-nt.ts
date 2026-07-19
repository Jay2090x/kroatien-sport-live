/**
 * Kroatien-Nationalmannschaft – ESPN (kein API-Key)
 * Wenige, gezielte Requests (kein Scoreboard-Sturm → keine Server-Timeouts)
 */

import type { LeagueId, Match, MatchStatus } from "@/types";
import { TV_CHANNELS } from "@/lib/constants";
import { enrichNationalTeamMatch } from "@/lib/data/national-team";

const ESPN_TEAM_ALL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/all/teams/477/schedule";
const ESPN_TEAM_WC =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/teams/477/schedule";

interface EspnCompetitor {
  homeAway: "home" | "away";
  score?: { value?: number; displayValue?: string } | string | number;
  team?: { displayName?: string; id?: string };
}

interface EspnEvent {
  id: string;
  date: string;
  name?: string;
  season?: { displayName?: string };
  seasonType?: { name?: string };
  competitions?: Array<{
    venue?: { fullName?: string };
    status?: { type?: { name?: string; detail?: string } };
    league?: { name?: string; slug?: string };
    competitors?: EspnCompetitor[];
  }>;
}

function pickTv() {
  return TV_CHANNELS.filter((c) =>
    ["hrt", "hrt2", "sky-de", "dazn"].includes(c.id)
  );
}

function scoreOf(c?: EspnCompetitor): number | null {
  if (!c?.score) return null;
  if (typeof c.score === "number") return c.score;
  if (typeof c.score === "string") {
    const n = Number(c.score);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof c.score.value === "number") return c.score.value;
  if (c.score.displayValue != null) {
    const n = Number(c.score.displayValue);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function mapStatus(name?: string): MatchStatus {
  const s = (name || "").toUpperCase();
  if (s.includes("IN_PROGRESS") || s.includes("LIVE")) {
    if (s.includes("HALF")) return "halftime";
    return "live";
  }
  if (s.includes("HALFTIME")) return "halftime";
  if (s.includes("FULL_TIME") || s.includes("FINAL")) return "finished";
  if (s.includes("POSTPON")) return "postponed";
  if (s.includes("CANCEL")) return "cancelled";
  return "scheduled";
}

function mapLeague(slug?: string, name?: string): { id: LeagueId; name: string } {
  const s = `${slug || ""} ${name || ""}`.toLowerCase();
  if (s.includes("world") && s.includes("qual"))
    return { id: "world-cup", name: name || "WM-Qualifikation" };
  if (s.includes("fifa.world") || (s.includes("world cup") && !s.includes("qual")))
    return { id: "world-cup", name: name || "FIFA WM" };
  if (s.includes("nations"))
    return { id: "nations-league", name: name || "UEFA Nations League" };
  if (s.includes("friendly"))
    return { id: "friendly", name: name || "Freundschaftsspiel" };
  if (s.includes("euro"))
    return { id: "other", name: name || "UEFA EURO" };
  return { id: "other", name: name || "Länderspiel" };
}

function involvesCroatia(e: EspnEvent): boolean {
  if (/croat/i.test(e.name || "")) return true;
  const comps = e.competitions?.[0]?.competitors ?? [];
  return comps.some((c) => /croat/i.test(c.team?.displayName || ""));
}

function mapEspnEvent(e: EspnEvent): Match | null {
  const c = e.competitions?.[0];
  if (!c) return null;
  const home = c.competitors?.find((x) => x.homeAway === "home");
  const away = c.competitors?.find((x) => x.homeAway === "away");
  if (!home?.team?.displayName || !away?.team?.displayName) return null;

  const league = mapLeague(c.league?.slug, c.league?.name || e.season?.displayName);
  const status = mapStatus(c.status?.type?.name);
  const homeScore = scoreOf(home);
  const awayScore = scoreOf(away);

  // League-Name aus Event-Kontext verbessern
  let leagueId = league.id;
  let leagueName = league.name;
  const slug = c.league?.slug || "";
  if (slug.includes("nations") || /nations/i.test(e.name || "")) {
    leagueId = "nations-league";
    leagueName = c.league?.name || "UEFA Nations League";
  }

  return {
    id: `espn-cro-${e.id}`,
    homeTeam: home.team.displayName,
    awayTeam: away.team.displayName,
    homeScore:
      status === "scheduled" || status === "postponed" ? null : homeScore,
    awayScore:
      status === "scheduled" || status === "postponed" ? null : awayScore,
    status,
    kickoff: new Date(e.date).toISOString(),
    league: leagueId,
    leagueName:
      leagueName + (e.seasonType?.name ? ` · ${e.seasonType.name}` : ""),
    venue: c.venue?.fullName,
    croatianPlayers: [],
    tvChannels: pickTv(),
    externalIds: { footballData: e.id },
  };
}

async function fetchEspnJson(url: string): Promise<EspnEvent[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return [];
    const json = (await res.json()) as { events?: EspnEvent[] };
    return json.events ?? [];
  } catch {
    return [];
  }
}

/** Wenige gezielte Scoreboard-Fenster (Nations League Herbst) */
function keyScoreboardUrls(now = new Date()): string[] {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  // immer aktuelles + nächstes NL-Fenster (Sep–Nov)
  const year = m >= 8 ? y : y; // ab Aug Fokus dieses Jahr, sonst auch nächstes
  const urls: string[] = [
    `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard?dates=${year}0901-${year}1130`,
    `https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.nations/scoreboard?dates=${year + 1}0301-${year + 1}0331`,
  ];
  // aktueller Monat (falls Freundschaftsspiele)
  const mm = String(m).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  urls.push(
    `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard?dates=${y}${mm}01-${y}${mm}${String(lastDay).padStart(2, "0")}`
  );
  return urls;
}

export async function fetchCroatiaNationalTeamMatches(): Promise<{
  matches: Match[];
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const scoreboardUrls = keyScoreboardUrls();
    const [all, wc, ...boards] = await Promise.all([
      fetchEspnJson(ESPN_TEAM_ALL),
      fetchEspnJson(ESPN_TEAM_WC),
      ...scoreboardUrls.map((u) => fetchEspnJson(u)),
    ]);

    const byId = new Map<string, EspnEvent>();
    for (const e of all) byId.set(e.id, e);
    for (const e of wc) byId.set(e.id, e);
    for (const list of boards) {
      for (const e of list) {
        if (involvesCroatia(e)) byId.set(e.id, e);
      }
    }

    if (!byId.size) {
      errors.push("espn: no croatia fixtures found");
    }

    const matches: Match[] = [];
    for (const e of byId.values()) {
      const m = mapEspnEvent(e);
      if (!m) continue;
      matches.push(enrichNationalTeamMatch(m));
    }

    matches.sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

    return { matches, errors };
  } catch (e) {
    errors.push(e instanceof Error ? e.message : "croatia-nt failed");
    return { matches: [], errors };
  }
}
