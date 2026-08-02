/**
 * Placeholder + editorial guide data for Croatian sports live board.
 * Replace / merge with API later – structure stays stable.
 */

import type { GuideCatalog, GuideMatch, TvGuideSlot } from "@/types/guide";

/** Kickoffs relative to "now" so demo always looks alive */
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

/**
 * Catalog = multi-sport + stream enrichments only.
 * Football live/upcoming comes primarily from the Live-API merge
 * (see merge-guide-live.ts). Keep football demos minimal as fallback.
 */
const MATCHES: GuideMatch[] = [
  {
    id: "guide-fallback-hnl",
    sport: "football",
    status: "upcoming",
    kickoff: hoursFromNow(8),
    homeTeam: "Rijeka",
    awayTeam: "Osijek",
    competition: "HNL",
    competitionShort: "HNL",
    venue: "Rujevica",
    featured: false,
    // Keine TV-Streams ohne bestätigte Live-Übertragung
    streams: [],
    croatianPlayers: [],
  },
  {
    id: "guide-hb-1",
    sport: "handball",
    status: "upcoming",
    kickoff: hoursFromNow(30),
    homeTeam: "Kroatien",
    awayTeam: "Dänemark",
    competition: "Handball Freundschaft",
    competitionShort: "HB",
    featured: false,
    streams: [],
    croatianPlayers: [],
  },
  {
    id: "guide-bb-1",
    sport: "basketball",
    status: "upcoming",
    kickoff: hoursFromNow(48),
    homeTeam: "Cibona",
    awayTeam: "Zadar",
    competition: "Premijer liga",
    competitionShort: "ABA",
    featured: false,
    streams: [],
    croatianPlayers: [],
  },
  {
    id: "guide-wp-1",
    sport: "waterpolo",
    status: "upcoming",
    kickoff: hoursFromNow(96),
    homeTeam: "Jug",
    awayTeam: "Mladost",
    competition: "Vaterpolo liga",
    competitionShort: "WP",
    featured: false,
    streams: [],
    croatianPlayers: [],
  },
];

function todaySlots(): TvGuideSlot[] {
  const base = new Date();
  base.setMinutes(0, 0, 0);
  const at = (h: number, m = 0) => {
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    {
      id: "tv-1",
      channelId: "hrt2",
      channelName: "HRT 2",
      start: at(18, 0),
      end: at(19, 45),
      title: "Sportski dnevnik + HNL Highlights",
      sport: "football",
    },
    {
      id: "tv-2",
      channelId: "arena1",
      channelName: "Arena Sport 1",
      start: at(20, 0),
      end: at(22, 0),
      title: "HNL: Dinamo – Hajduk (Live)",
      sport: "football",
      isLive: true,
    },
    {
      id: "tv-3",
      channelId: "sportklub",
      channelName: "Sport Klub",
      start: at(20, 30),
      end: at(22, 30),
      title: "Premier League mit kroatischer Beteiligung",
      sport: "football",
    },
    {
      id: "tv-4",
      channelId: "arena2",
      channelName: "Arena Sport 2",
      start: at(19, 0),
      end: at(20, 45),
      title: "Handball: Freundschaftsspiel",
      sport: "handball",
    },
    {
      id: "tv-5",
      channelId: "hrt",
      channelName: "HRT 1",
      start: at(22, 15),
      end: at(23, 0),
      title: "Vatreni Magazin",
      sport: "football",
    },
  ];
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
