/**
 * Merges editorial/placeholder guide fixtures with live API matches.
 * Live football fixtures win on identity; catalog keeps multi-sport + rich streams.
 */

import type { Match, TvChannel } from "@/types";
import type { GuideMatch, StreamProvider, StreamQuality } from "@/types/guide";
import { isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { isAllowedTvChannel } from "@/lib/constants";

function channelToStream(ch: TvChannel, idx: number): StreamProvider | null {
  if (!isAllowedTvChannel(ch.id) || !isAllowedTvChannel(ch.name)) return null;

  const qualities: StreamQuality[] = [];
  if (ch.type === "free") qualities.push("free");
  qualities.push(ch.certainty === "confirmed" ? "stable" : "hd-720");
  if (/hrt/i.test(ch.name)) qualities.push("croatian-commentary");

  return {
    id: `live-${ch.id}-${idx}`,
    name: ch.name,
    brand: shortBrand(ch.name),
    url: ch.url,
    qualities: qualities.length ? qualities : ["hd-720"],
    upvotes: ch.certainty === "confirmed" ? 50 : 20,
    downvotes: 2,
    availableIn: ch.markets?.length
      ? ch.markets
      : ch.region
        ? ch.region.split(/[/,]/).map((s) => s.trim()).filter(Boolean)
        : [],
    type: ch.type,
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

/** Convert dashboard Match → GuideMatch */
export function matchToGuideMatch(m: Match, locale = "de"): GuideMatch {
  const streams = (m.tvChannels ?? [])
    .map((ch, i) => channelToStream(ch, i))
    .filter((s): s is StreamProvider => s != null);
  const seen = new Set<string>();
  const uniqueStreams = streams.filter((s) => {
    if (seen.has(s.brand)) return false;
    seen.add(s.brand);
    return true;
  });

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

/**
 * Merge catalog (multi-sport / editorial streams) with live API football matches.
 * - API live/upcoming football replaces catalog football on same day+teams
 * - Catalog non-football always kept
 * - Catalog football kept only if no API counterpart
 * - Prefer API streams; if API has none, keep catalog streams for that fixture
 */
export function mergeGuideWithLive(
  catalogMatches: GuideMatch[],
  liveMatches: Match[],
  locale = "de"
): GuideMatch[] {
  const fromApi = liveMatches
    .filter((m) => m.status !== "cancelled")
    .map((m) => matchToGuideMatch(m, locale));

  const apiByKey = new Map(fromApi.map((m) => [fixtureKey(m), m]));
  const catalogByKey = new Map(
    catalogMatches.map((m) => [fixtureKey(m), m])
  );

  const merged = new Map<string, GuideMatch>();

  // Start with API
  for (const [key, api] of apiByKey) {
    const cat = catalogByKey.get(key);
    if (cat && cat.streams.length && api.streams.length === 0) {
      merged.set(key, { ...api, streams: cat.streams, featured: true });
    } else if (cat && cat.streams.length && api.streams.length > 0) {
      // enrich: catalog brands missing on API
      const brands = new Set(api.streams.map((s) => s.brand.toLowerCase()));
      const extra = cat.streams.filter(
        (s) => !brands.has(s.brand.toLowerCase())
      );
      merged.set(key, {
        ...api,
        streams: [...api.streams, ...extra].slice(0, 6),
        featured: api.featured || cat.featured,
      });
    } else {
      merged.set(key, api);
    }
  }

  // Catalog-only (other sports or football not in API)
  for (const cat of catalogMatches) {
    const key = fixtureKey(cat);
    if (merged.has(key)) continue;
    // Skip catalog football that is stale finished demo if API has plenty of live football
    if (cat.sport === "football" && cat.status === "finished") continue;
    merged.set(key, cat);
  }

  return [...merged.values()].sort((a, b) => {
    const rank = (s: GuideMatch["status"]) =>
      s === "live" ? 0 : s === "upcoming" ? 1 : 2;
    const d = rank(a.status) - rank(b.status);
    if (d !== 0) return d;
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });
}
