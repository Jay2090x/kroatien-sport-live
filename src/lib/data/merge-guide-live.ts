/**
 * Merges catalog + live API. Next 7 days only for upcoming.
 * TV streams only if confirmed live broadcast (certainty confirmed).
 * Includes Croatian player names from API.
 */

import type { Match, TvChannel } from "@/types";
import type { GuideMatch, StreamProvider, StreamQuality } from "@/types/guide";
import { isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { isAllowedTvChannel } from "@/lib/constants";
import { resolveMatchTvChannels } from "@/lib/broadcast-rights";

const MS_DAY = 24 * 3600_000;
export const UPCOMING_WINDOW_DAYS = 7;

function channelToStream(ch: TvChannel, idx: number): StreamProvider | null {
  if (!isAllowedTvChannel(ch.id) || !isAllowedTvChannel(ch.name)) return null;
  // Strict: only confirmed live broadcasts
  if (ch.certainty !== "confirmed") return null;

  const qualities: StreamQuality[] = [];
  if (ch.type === "free") qualities.push("free");
  qualities.push("stable");
  if (/hrt/i.test(ch.name)) qualities.push("croatian-commentary");

  return {
    id: `live-${ch.id}-${idx}`,
    name: ch.name,
    brand: shortBrand(ch.name),
    url: ch.url,
    qualities: qualities.length ? qualities : ["hd-720"],
    upvotes: 40,
    downvotes: 1,
    availableIn: ch.markets?.length
      ? ch.markets
      : ch.region
        ? ch.region.split(/[/,]/).map((s) => s.trim()).filter(Boolean)
        : [],
    type: ch.type,
    confirmedLive: true,
  };
}

function shortBrand(name: string): string {
  if (/hrt\s*2/i.test(name)) return "HRT 2";
  if (/hrt/i.test(name)) return "HRT";
  if (/sport\s*klub|sportklub/i.test(name)) return "Sportklub";
  if (/arena/i.test(name)) return "Arena";
  return name.split(/[–—-]/)[0]?.trim().slice(0, 12) || name.slice(0, 12);
}

function guideStatus(m: Match): GuideMatch["status"] {
  if (isLiveStatus(m.status)) return "live";
  if (m.status === "finished" || m.status === "cancelled") return "finished";
  return "upcoming";
}

function withinNextDays(kickoff: string, days: number, now = Date.now()): boolean {
  const t = new Date(kickoff).getTime();
  if (Number.isNaN(t)) return false;
  return t >= now - 3 * 3600_000 && t <= now + days * MS_DAY;
}

/** Convert dashboard Match → GuideMatch */
export function matchToGuideMatch(m: Match, locale = "de"): GuideMatch {
  const confirmed = resolveMatchTvChannels(m);
  const streams = confirmed
    .map((ch, i) => channelToStream(ch, i))
    .filter((s): s is StreamProvider => s != null);

  const seen = new Set<string>();
  const uniqueStreams = streams.filter((s) => {
    if (seen.has(s.brand)) return false;
    seen.add(s.brand);
    return true;
  });

  const croatianPlayers = (m.croatianPlayers ?? []).map((p) => ({
    playerId: p.playerId,
    playerName: p.playerName,
  }));

  return {
    id: `api-${m.id}`,
    sport: "football",
    status: guideStatus(m),
    kickoff: m.kickoff,
    homeTeam: localizeTeamName(m.homeTeam, locale),
    awayTeam: localizeTeamName(m.awayTeam, locale),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    minute: m.minute ?? null,
    competition: m.leagueName.replace(/ · .*$/, ""),
    competitionShort: competitionShort(m.league, m.leagueName),
    venue: m.venue,
    featured:
      m.league === "nations-league" ||
      m.league === "hnl" ||
      m.league === "champions-league" ||
      isLiveStatus(m.status),
    streams: uniqueStreams,
    croatianPlayers,
    appMatchId: m.id,
  };
}

function competitionShort(
  league: Match["league"],
  leagueName: string
): string {
  const map: Partial<Record<Match["league"], string>> = {
    "premier-league": "PL",
    bundesliga: "BL",
    "serie-a": "SA",
    laliga: "LL",
    "ligue-1": "L1",
    hnl: "HNL",
    "nations-league": "NL",
    "champions-league": "UCL",
    "europa-league": "UEL",
    "conference-league": "UECL",
    "world-cup": "WM",
    friendly: "FR",
  };
  return map[league] || leagueName.slice(0, 8);
}

function fixtureKey(m: GuideMatch): string {
  const day = m.kickoff.slice(0, 10);
  const teams = [m.homeTeam, m.awayTeam]
    .map((t) =>
      t
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "")
    )
    .sort()
    .join("-");
  return `${day}|${teams}`;
}

export function mergeGuideWithLive(
  catalogMatches: GuideMatch[],
  liveMatches: Match[],
  locale = "de"
): GuideMatch[] {
  const now = Date.now();

  // Re-resolve TV on API matches (confirmed only)
  const fromApi = liveMatches
    .filter((m) => m.status !== "cancelled")
    .map((m) => {
      const withTv = { ...m, tvChannels: resolveMatchTvChannels(m) };
      return matchToGuideMatch(withTv, locale);
    })
    .filter((m) => {
      if (m.status === "live") return true;
      if (m.status === "finished") {
        const t = new Date(m.kickoff).getTime();
        return t >= now - 2 * MS_DAY && t <= now;
      }
      return withinNextDays(m.kickoff, UPCOMING_WINDOW_DAYS, now);
    });

  const apiByKey = new Map(fromApi.map((m) => [fixtureKey(m), m]));
  const merged = new Map<string, GuideMatch>();

  for (const [key, api] of apiByKey) {
    merged.set(key, api);
  }

  // Catalog multi-sport only, next 7 days, no guessed TV streams
  for (const cat of catalogMatches) {
    if (cat.sport === "football") continue; // football only from API
    if (cat.status === "finished") continue;
    if (cat.status === "upcoming" && !withinNextDays(cat.kickoff, UPCOMING_WINDOW_DAYS, now))
      continue;
    if (cat.status === "live" && !withinNextDays(cat.kickoff, 1, now)) continue;
    const key = fixtureKey(cat);
    if (merged.has(key)) continue;
    // Strip unconfirmed streams from catalog
    merged.set(key, {
      ...cat,
      streams: (cat.streams ?? []).filter((s) => s.confirmedLive === true),
      croatianPlayers: cat.croatianPlayers ?? [],
    });
  }

  return [...merged.values()].sort((a, b) => {
    const rank = (s: GuideMatch["status"]) =>
      s === "live" ? 0 : s === "upcoming" ? 1 : 2;
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });
}
