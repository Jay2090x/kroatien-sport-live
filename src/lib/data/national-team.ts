/**
 * Kroatische Nationalmannschaft (Vatreni)
 * TheSportsDB Team-ID (Croatia)
 */

import type { Match } from "@/types";
import { TV_CHANNELS } from "@/lib/constants";

/** TheSportsDB: Croatia national team */
export const CROATIA_NT_TEAM_ID = "133912";
export const CROATIA_NT_NAME = "Croatia";

export const CROATIA_NT_LABEL = {
  de: "Kroatien Nationalmannschaft",
  en: "Croatia National Team",
} as const;

function pick(...ids: string[]) {
  return TV_CHANNELS.filter((c) => ids.includes(c.id));
}

/**
 * NT-Match metdaten anreichern.
 * KEIN voller Kader – der ist vor Nominierung unbekannt.
 * croatianPlayers nur behalten, wenn schon echte Daten drin sind.
 */
export function enrichNationalTeamMatch(match: Match): Match {
  const isHome = /croatia|kroatien|hrvatska/i.test(match.homeTeam);
  const isAway = /croatia|kroatien|hrvatska/i.test(match.awayTeam);
  if (!isHome && !isAway) return match;

  const leagueName = (match.leagueName || "").toLowerCase();
  const league =
    leagueName.includes("world") && !leagueName.includes("qual")
      ? "world-cup"
      : leagueName.includes("nations")
        ? "nations-league"
        : match.league === "friendly" || leagueName.includes("friendly")
          ? "friendly"
          : match.league;

  return {
    ...match,
    league: league as Match["league"],
    // Unbekannter Kader = leere Liste (nicht 20+ Spekulationen)
    croatianPlayers: match.croatianPlayers?.length ? match.croatianPlayers : [],
    tvChannels: match.tvChannels?.length
      ? match.tvChannels
      : pick("hrt", "hrt2", "sky-de", "dazn"),
  };
}

/** @deprecated use enrichNationalTeamMatch */
export function attachNationalTeamPlayers(match: Match): Match {
  return enrichNationalTeamMatch(match);
}

export function isNationalTeamMatch(match: Match): boolean {
  return (
    /croatia|kroatien|hrvatska/i.test(match.homeTeam) ||
    /croatia|kroatien|hrvatska/i.test(match.awayTeam) ||
    match.league === "nations-league" ||
    (match.league === "world-cup" &&
      (/croatia|kroatien|hrvatska/i.test(match.homeTeam) ||
        /croatia|kroatien|hrvatska/i.test(match.awayTeam)))
  );
}

export function filterNationalTeamMatches(matches: Match[]): Match[] {
  return matches
    .filter(isNationalTeamMatch)
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
}

export function filterClubMatches(matches: Match[]): Match[] {
  return matches.filter((m) => !isNationalTeamMatch(m));
}
