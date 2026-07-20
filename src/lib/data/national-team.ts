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
 * Teamnamen normalisieren (Croatia/Kroatien, Czechia/Czech Republic, …)
 * für Deduplizierung über API-Grenzen (ESPN vs TheSportsDB).
 */
export function normalizeTeamKey(name: string): string {
  const s = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Länder-Aliase
  const aliases: Array<[RegExp, string]> = [
    [/\b(croatia|kroatien|hrvatska|cro)\b/, "croatia"],
    [/\b(czechia|czech republic|tschechien|cesko|ceska republika)\b/, "czechia"],
    [/\b(england|eng)\b/, "england"],
    [/\b(spain|spanien|espana|esp)\b/, "spain"],
    [/\b(portugal|por)\b/, "portugal"],
    [/\b(france|frankreich|fra)\b/, "france"],
    [/\b(germany|deutschland|ger|deu)\b/, "germany"],
    [/\b(italy|italien|ita)\b/, "italy"],
    [/\b(netherlands|holland|niederlande|ned)\b/, "netherlands"],
    [/\b(poland|polen|pol)\b/, "poland"],
    [/\b(turkey|turkei|turkiye|tur)\b/, "turkey"],
    [/\b(scotland|schottland|sco)\b/, "scotland"],
    [/\b(wales|wal)\b/, "wales"],
    [/\b(belgium|belgien|bel)\b/, "belgium"],
    [/\b(austria|osterreich|aut)\b/, "austria"],
    [/\b(switzerland|schweiz|sui|che)\b/, "switzerland"],
    [/\b(serbia|serbien|srb)\b/, "serbia"],
    [/\b(slovenia|slowenien|svn)\b/, "slovenia"],
    [/\b(hungary|ungarn|hun)\b/, "hungary"],
    [/\b(ghana|gha)\b/, "ghana"],
    [/\b(panama|pan)\b/, "panama"],
  ];
  for (const [re, key] of aliases) {
    if (re.test(s)) return key;
  }
  return s;
}

/** Fixture-Schlüssel: Datum + beide Teams (reihenfolgeunabhängig) */
export function fixtureKey(match: {
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
}): string {
  const day = match.kickoff.slice(0, 10);
  const a = normalizeTeamKey(match.homeTeam);
  const b = normalizeTeamKey(match.awayTeam);
  const [x, y] = a < b ? [a, b] : [b, a];
  return `${day}|${x}|${y}`;
}

/**
 * Doppelte Spiele entfernen (gleiche Gegner am gleichen Tag, egal welche API-ID).
 * Bevorzugt: ESPN (espn-), dann fertige Live-Stände, dann längeren League-Namen.
 */
export function dedupeFixtures(matches: Match[]): Match[] {
  const map = new Map<string, Match>();

  const score = (m: Match): number => {
    let s = 0;
    if (m.id.startsWith("espn-")) s += 50;
    if (m.id.startsWith("tsdb-") || m.id.includes("tsdb")) s += 20;
    if (m.status === "live" || m.status === "halftime") s += 30;
    if (m.status === "finished") s += 15;
    if (m.homeScore != null && m.awayScore != null) s += 10;
    if (m.venue) s += 5;
    if (m.tvChannels?.length) s += 3;
    if ((m.leagueName || "").length > 12) s += 2;
    if (m.croatianPlayers?.length) s += m.croatianPlayers.length;
    return s;
  };

  for (const m of matches) {
    const key = fixtureKey(m);
    const prev = map.get(key);
    if (!prev) {
      map.set(key, m);
      continue;
    }
    // Bessere Variante behalten, Metadaten mergen
    const keep = score(m) >= score(prev) ? m : prev;
    const drop = keep === m ? prev : m;
    map.set(key, {
      ...drop,
      ...keep,
      // stabile ID der bevorzugten Quelle
      id: keep.id,
      homeScore: keep.homeScore ?? drop.homeScore,
      awayScore: keep.awayScore ?? drop.awayScore,
      status:
        keep.status !== "scheduled"
          ? keep.status
          : drop.status !== "scheduled"
            ? drop.status
            : keep.status,
      minute: keep.minute ?? drop.minute,
      venue: keep.venue || drop.venue,
      tvChannels: keep.tvChannels?.length ? keep.tvChannels : drop.tvChannels,
      croatianPlayers: keep.croatianPlayers?.length
        ? keep.croatianPlayers
        : drop.croatianPlayers,
      homeTeamLogo: keep.homeTeamLogo || drop.homeTeamLogo,
      awayTeamLogo: keep.awayTeamLogo || drop.awayTeamLogo,
      leagueName: keep.leagueName || drop.leagueName,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );
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
  return dedupeFixtures(matches.filter(isNationalTeamMatch));
}

export function filterClubMatches(matches: Match[]): Match[] {
  return matches.filter((m) => !isNationalTeamMatch(m));
}
