/**
 * Placeholder + editorial guide data for Croatian sports live board.
 * Replace / merge with API later – structure stays stable.
 */

import type { GuideCatalog, GuideMatch, TvGuideSlot } from "@/types/guide";

/**
 * Keine Demo-Spiele. Fake-Termine zerstören Vertrauen.
 * Fußball kommt ausschließlich aus der Live-API.
 */
const MATCHES: GuideMatch[] = [];

/** Kein erfundenes EPG – TV nur aus bestätigten Live-Spielen */
function todaySlots(): TvGuideSlot[] {
  return [];
}

export const GUIDE_CATALOG: GuideCatalog = {
  version: "1.0.0",
  updatedAt: new Date().toISOString(),
  matches: MATCHES,
  tvGuide: todaySlots(),
};

export function getGuideCatalog(): GuideCatalog {
  // Rebuild TV slots daily relative times for matches already use relative helpers
  return {
    ...GUIDE_CATALOG,
    updatedAt: new Date().toISOString(),
    tvGuide: todaySlots(),
  };
}

export function filterGuideMatches(
  matches: GuideMatch[],
  sport: string,
  query: string
): GuideMatch[] {
  const q = query.trim().toLowerCase();
  return matches.filter((m) => {
    if (sport && sport !== "all" && sport !== "tv" && m.sport !== sport)
      return false;
    if (!q) return true;
    return (
      m.homeTeam.toLowerCase().includes(q) ||
      m.awayTeam.toLowerCase().includes(q) ||
      m.competition.toLowerCase().includes(q) ||
      m.streams.some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.brand.toLowerCase().includes(q)
      )
    );
  });
}
