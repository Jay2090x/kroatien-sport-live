/**
 * Placeholder + editorial guide data for Croatian sports live board.
 * Replace / merge with API later – structure stays stable.
 */

import type { GuideCatalog, GuideMatch, TvGuideSlot } from "@/types/guide";

/** Kickoffs relative to "now" so demo always looks alive */
function hoursFromNow(h: number): string {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

const MATCHES: GuideMatch[] = [
  {
    id: "guide-live-hnl-1",
    sport: "football",
    status: "live",
    kickoff: hoursAgo(0.75),
    homeTeam: "Dinamo Zagreb",
    awayTeam: "Hajduk Split",
    homeScore: 1,
    awayScore: 1,
    minute: 67,
    competition: "HNL",
    competitionShort: "HNL",
    venue: "Maksimir",
    featured: true,
    streams: [
      {
        id: "s-arena-1",
        name: "Arena Sport 1",
        brand: "Arena",
        url: "https://www.arenasport.tv",
        qualities: ["hd-1080", "croatian-commentary", "stable"],
        upvotes: 128,
        downvotes: 8,
        availableIn: ["HR", "BA", "RS", "SI", "ME"],
        geoLockedOutside: true,
        type: "paid",
      },
      {
        id: "s-sk-1",
        name: "Sport Klub",
        brand: "Sportklub",
        url: "https://www.sportklub.hr",
        qualities: ["hd-720", "croatian-commentary", "stable"],
        upvotes: 64,
        downvotes: 12,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "paid",
      },
    ],
  },
  {
    id: "guide-live-pl-1",
    sport: "football",
    status: "live",
    kickoff: hoursAgo(0.4),
    homeTeam: "Manchester City",
    awayTeam: "Brighton",
    homeScore: 2,
    awayScore: 0,
    minute: 54,
    competition: "Premier League",
    competitionShort: "PL",
    venue: "Etihad",
    featured: true,
    streams: [
      {
        id: "s-sky-1",
        name: "Sky Sport",
        brand: "Sky",
        url: "https://www.sky.de/sport",
        qualities: ["hd-1080", "stable"],
        upvotes: 210,
        downvotes: 15,
        availableIn: ["DE", "AT"],
        geoLockedOutside: true,
        type: "paid",
      },
      {
        id: "s-dazn-1",
        name: "DAZN",
        brand: "DAZN",
        url: "https://www.dazn.com",
        qualities: ["hd-1080", "stable"],
        upvotes: 188,
        downvotes: 22,
        availableIn: ["DE", "AT", "CH"],
        geoLockedOutside: true,
        type: "streaming",
      },
    ],
  },
  {
    id: "guide-up-nt-1",
    sport: "football",
    status: "upcoming",
    kickoff: hoursFromNow(26),
    homeTeam: "Tschechien",
    awayTeam: "Kroatien",
    competition: "UEFA Nations League",
    competitionShort: "NL",
    venue: "Prag",
    featured: true,
    streams: [
      {
        id: "s-hrt-nt",
        name: "HRT 2",
        brand: "HRT 2",
        url: "https://player.hrt.hr/",
        qualities: ["hd-1080", "croatian-commentary", "free", "stable"],
        upvotes: 340,
        downvotes: 4,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "free",
      },
      {
        id: "s-arena-nt",
        name: "Arena Sport",
        brand: "Arena",
        url: "https://www.arenasport.tv",
        qualities: ["hd-1080", "croatian-commentary", "stable"],
        upvotes: 95,
        downvotes: 6,
        availableIn: ["HR", "BA", "RS"],
        geoLockedOutside: true,
        type: "paid",
      },
    ],
  },
  {
    id: "guide-up-nt-2",
    sport: "football",
    status: "upcoming",
    kickoff: hoursFromNow(50),
    homeTeam: "Spanien",
    awayTeam: "Kroatien",
    competition: "UEFA Nations League",
    competitionShort: "NL",
    venue: "Sevilla",
    featured: true,
    streams: [
      {
        id: "s-hrt-nt2",
        name: "HRT 2",
        brand: "HRT 2",
        url: "https://player.hrt.hr/",
        qualities: ["hd-1080", "croatian-commentary", "free"],
        upvotes: 120,
        downvotes: 2,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "free",
      },
    ],
  },
  {
    id: "guide-up-hnl-2",
    sport: "football",
    status: "upcoming",
    kickoff: hoursFromNow(5),
    homeTeam: "Rijeka",
    awayTeam: "Osijek",
    competition: "HNL",
    competitionShort: "HNL",
    venue: "Rujevica",
    featured: false,
    streams: [
      {
        id: "s-arena-hnl",
        name: "Arena Sport 2",
        brand: "Arena",
        url: "https://www.arenasport.tv",
        qualities: ["hd-720", "croatian-commentary"],
        upvotes: 41,
        downvotes: 5,
        availableIn: ["HR", "BA"],
        geoLockedOutside: true,
        type: "paid",
      },
    ],
  },
  {
    id: "guide-up-cl-1",
    sport: "football",
    status: "upcoming",
    kickoff: hoursFromNow(72),
    homeTeam: "Dinamo Zagreb",
    awayTeam: "TBD",
    competition: "Champions League Quali",
    competitionShort: "UCL",
    venue: "Maksimir",
    featured: true,
    streams: [
      {
        id: "s-hrt-cl",
        name: "HRT",
        brand: "HRT",
        url: "https://player.hrt.hr/",
        qualities: ["hd-1080", "croatian-commentary", "free"],
        upvotes: 200,
        downvotes: 3,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "free",
      },
      {
        id: "s-dazn-cl",
        name: "DAZN",
        brand: "DAZN",
        url: "https://www.dazn.com",
        qualities: ["hd-1080", "stable"],
        upvotes: 150,
        downvotes: 10,
        availableIn: ["DE", "AT"],
        geoLockedOutside: true,
        type: "streaming",
      },
    ],
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
    streams: [
      {
        id: "s-hrt-hb",
        name: "HRT 2",
        brand: "HRT 2",
        url: "https://player.hrt.hr/",
        qualities: ["hd-720", "croatian-commentary", "free"],
        upvotes: 55,
        downvotes: 1,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "free",
      },
    ],
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
    streams: [
      {
        id: "s-arena-bb",
        name: "Arena Sport",
        brand: "Arena",
        url: "https://www.arenasport.tv",
        qualities: ["hd-720", "croatian-commentary"],
        upvotes: 28,
        downvotes: 4,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "paid",
      },
    ],
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
    streams: [
      {
        id: "s-hrt-wp",
        name: "HRT",
        brand: "HRT",
        url: "https://player.hrt.hr/",
        qualities: ["sd", "croatian-commentary", "free"],
        upvotes: 18,
        downvotes: 2,
        availableIn: ["HR"],
        geoLockedOutside: true,
        type: "free",
      },
    ],
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
