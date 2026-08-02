/**
 * Nur bestätigte Live-Übertragungen – keine „typischen Rechte“-Schätzungen.
 *
 * Einträge hier nur, wenn HNS / Sender / Club öffentlich bestätigt hat,
 * dass dieser Anbieter DAS konkrete Spiel live zeigt.
 * Key: fixture day + normalized teams OR match external id.
 */

import type { Match, TvChannel } from "@/types";
import { TV_CHANNELS, isAllowedTvChannel } from "@/lib/constants";

export type ConfirmedBroadcast = {
  /** ISO day YYYY-MM-DD (kickoff UTC day or local – use kickoff.slice(0,10)) */
  day: string;
  /** Substrings that must appear in home+away (case-insensitive), both sides */
  homeIncludes: string[];
  awayIncludes: string[];
  channelIds: string[];
  source: string;
};

/**
 * Redaktionell bestätigte Live-Sendungen.
 * Leer = wir zeigen keine TV-Chips (ehrlich).
 * Beispiel-Einträge bei HNS/HRT-Bestätigung ergänzen.
 */
export const CONFIRMED_BROADCASTS: ConfirmedBroadcast[] = [
  // Beispiel (auskommentiert – nur bei echter Bestätigung aktivieren):
  // {
  //   day: "2026-09-26",
  //   homeIncludes: ["czech", "tschech", "cesk"],
  //   awayIncludes: ["croat", "kroat", "hrvat"],
  //   channelIds: ["hrt", "hrt2"],
  //   source: "HNS / HRT Programm",
  // },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function sideMatches(team: string, needles: string[]): boolean {
  const t = norm(team);
  return needles.some((n) => t.includes(norm(n)));
}

function channelById(id: string): TvChannel | null {
  if (!isAllowedTvChannel(id)) return null;
  const base = TV_CHANNELS.find((c) => c.id === id);
  if (!base) return null;
  return {
    ...base,
    certainty: "confirmed",
    markets: base.markets ?? (base.region ? base.region.split(/[/,]/) : []),
  };
}

/** Resolve confirmed live TV for a match – empty if nothing confirmed */
export function confirmedTvForMatch(m: Match): TvChannel[] {
  const day = m.kickoff.slice(0, 10);
  const home = m.homeTeam;
  const away = m.awayTeam;

  const hits = CONFIRMED_BROADCASTS.filter((b) => {
    if (b.day !== day) return false;
    const ha =
      (sideMatches(home, b.homeIncludes) && sideMatches(away, b.awayIncludes)) ||
      (sideMatches(home, b.awayIncludes) && sideMatches(away, b.homeIncludes));
    return ha;
  });

  const ids = new Set<string>();
  for (const h of hits) for (const id of h.channelIds) ids.add(id);

  return [...ids]
    .map(channelById)
    .filter((c): c is TvChannel => c != null);
}

/**
 * Default: keine geschätzten Rechte mehr.
 * Nur confirmed list – attachCompetitionTv bleibt als leerer Stub für Imports.
 */
export function attachCompetitionTv(_league?: string): TvChannel[] {
  return [];
}

/** Prefer confirmed; never fall back to typical matrix */
export function resolveMatchTvChannels(m: Match): TvChannel[] {
  return confirmedTvForMatch(m);
}
