/**
 * Merges catalog + live API. Next 7 days only for upcoming.
 * TV streams only if confirmed live broadcast (certainty confirmed).
 * Croatian players: club/position + last appearance from feed (honest).
 */

import type { Match, MatchPlayerAppearance, Player, TvChannel } from "@/types";
import type {
  GuideMatch,
  GuideMatchPlayer,
  StreamProvider,
  StreamQuality,
} from "@/types/guide";
import { isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { isAllowedTvChannel } from "@/lib/constants";
import { resolveMatchTvChannels } from "@/lib/broadcast-rights";
import { appearanceChip } from "@/lib/player-form";

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

function shortOpp(name: string, locale: string): string {
  const n = localizeTeamName(name, locale);
  return n.length > 18 ? `${n.slice(0, 16)}…` : n;
}

/** Vorheriger Einsatz desselben Spielers (andere Partie im Feed). */
function lastAppForPlayer(
  playerId: string,
  currentMatchId: string,
  allMatches: Match[],
  locale: string
): string | undefined {
  const prev = allMatches
    .filter(
      (m) =>
        m.id !== currentMatchId &&
        (m.status === "finished" ||
          m.status === "live" ||
          m.status === "halftime") &&
        m.croatianPlayers?.some((p) => p.playerId === playerId)
    )
    .sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )[0];
  if (!prev) return undefined;

  const app = prev.croatianPlayers.find((p) => p.playerId === playerId);
  if (!app) return undefined;

  const vs =
    app.teamSide === "home"
      ? prev.awayTeam
      : app.teamSide === "away"
        ? prev.homeTeam
        : prev.awayTeam;

  let form = "";
  if (
    prev.status === "finished" &&
    prev.homeScore != null &&
    prev.awayScore != null &&
    (app.teamSide === "home" || app.teamSide === "away")
  ) {
    if (prev.homeScore === prev.awayScore) form = "D";
    else {
      const homeWin = prev.homeScore > prev.awayScore;
      form =
        app.teamSide === "home"
          ? homeWin
            ? "W"
            : "L"
          : homeWin
            ? "L"
            : "W";
    }
  }

  const score =
    prev.homeScore != null && prev.awayScore != null
      ? `${prev.homeScore}:${prev.awayScore}`
      : "–";
  const chip = appearanceChip(app);
  const bits = [
    score,
    form || null,
    `vs ${shortOpp(vs, locale)}`,
    chip && chip !== "·" ? chip : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

function toGuidePlayer(
  p: MatchPlayerAppearance,
  m: Match,
  allMatches: Match[],
  playersById: Map<string, Player>,
  locale: string
): GuideMatchPlayer {
  const profile = playersById.get(p.playerId);
  const avail = profile?.availability;
  let availabilityShort: string | undefined;
  if (avail && avail !== "available" && avail !== "unknown") {
    availabilityShort = avail;
  }

  return {
    playerId: p.playerId,
    playerName: p.playerName,
    position: p.position || profile?.position,
    club: profile?.club,
    teamSide: p.teamSide,
    isStarter: p.isStarter,
    didPlay: p.didPlay,
    minutesPlayed: p.minutesPlayed,
    goals: p.goals,
    assists: p.assists,
    yellowCards: p.yellowCards,
    redCard: p.redCard,
    substitutedOn: p.substitutedOn,
    substitutedOff: p.substitutedOff,
    eventsKnown: p.eventsKnown,
    lastAppSummary: lastAppForPlayer(
      p.playerId,
      m.id,
      allMatches,
      locale
    ),
    availabilityShort,
  };
}

/** Convert dashboard Match → GuideMatch */
export function matchToGuideMatch(
  m: Match,
  locale = "de",
  allMatches: Match[] = [],
  playersById: Map<string, Player> = new Map()
): GuideMatch {
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

  const pool = allMatches.length ? allMatches : [m];
  const croatianPlayers = (m.croatianPlayers ?? []).map((p) =>
    toGuidePlayer(p, m, pool, playersById, locale)
  );

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
    videoUrl: m.videoUrl,
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
  locale = "de",
  players: Player[] = []
): GuideMatch[] {
  const now = Date.now();
  const playersById = new Map(players.map((p) => [p.id, p]));

  // Re-resolve TV on API matches (confirmed only)
  const fromApi = liveMatches
    .filter((m) => m.status !== "cancelled")
    .map((m) => {
      const withTv = { ...m, tvChannels: resolveMatchTvChannels(m) };
      return matchToGuideMatch(withTv, locale, liveMatches, playersById);
    })
    .filter((m) => {
      if (m.status === "live") return true;
      if (m.status === "finished") {
        // Abgelaufene Spiele 7 Tage behalten (aufklappbar im Board)
        const t = new Date(m.kickoff).getTime();
        return t >= now - 7 * MS_DAY && t <= now + MS_DAY;
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
    // Freundschaften nach hinten – Pflichtspiele zuerst
    const friendly = (m: GuideMatch) =>
      /friend|freundschaft|friendly/i.test(m.competition) ? 1 : 0;
    const fd = friendly(a) - friendly(b);
    if (fd !== 0) return fd;
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });
}
