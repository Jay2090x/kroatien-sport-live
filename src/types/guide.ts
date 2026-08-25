/**
 * Guide / Streaming data model – easy to extend or load from API.
 */

export type SportId =
  | "all"
  | "football"
  | "handball"
  | "basketball"
  | "waterpolo"
  | "tv";

export type GuideMatchStatus = "live" | "upcoming" | "finished";

export type StreamQuality =
  | "hd-1080"
  | "hd-720"
  | "sd"
  | "croatian-commentary"
  | "stable"
  | "free"
  | "geo-locked";

export interface StreamProvider {
  id: string;
  name: string;
  url: string;
  /** Short brand for chip */
  brand: string;
  qualities: StreamQuality[];
  /** 0–100 community score */
  upvotes: number;
  downvotes: number;
  /** ISO countries where provider is typically available */
  availableIn: string[];
  type: "free" | "paid" | "streaming";
  /** Only show when true – confirmed live broadcast for this fixture */
  confirmedLive?: boolean;
}

export interface GuideMatchPlayer {
  playerId: string;
  playerName: string;
  /** Position code e.g. FW/MF */
  position?: string;
  /** Club name for context on upcoming fixtures */
  club?: string;
  teamSide?: "home" | "away";
  isStarter?: boolean;
  didPlay?: boolean;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCard?: boolean;
  substitutedOn?: number | null;
  substitutedOff?: number | null;
  eventsKnown?: boolean;
  /**
   * Compact prior appearance (other finished match in feed), e.g.
   * "1:0 W · vs Arsenal · 90' XI" — honest, never invented.
   */
  lastAppSummary?: string;
  /** Availability short label if known from tracker */
  availabilityShort?: string;
}

export interface GuideMatch {
  id: string;
  sport: Exclude<SportId, "all" | "tv">;
  status: GuideMatchStatus;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  minute?: number | null;
  competition: string;
  competitionShort?: string;
  venue?: string;
  /** Featured on Live Now board */
  featured?: boolean;
  streams: StreamProvider[];
  /** Kroaten in diesem Spiel (aus Live-API) */
  croatianPlayers?: GuideMatchPlayer[];
  /** Optional deep-link into app match id */
  appMatchId?: string;
  /** Highlight video (YouTube) if API provided one */
  videoUrl?: string;
}

export interface TvGuideSlot {
  id: string;
  channelId: string;
  channelName: string;
  start: string;
  end: string;
  title: string;
  sport: Exclude<SportId, "all" | "tv">;
  isLive?: boolean;
}

export interface GuideCatalog {
  version: string;
  updatedAt: string;
  matches: GuideMatch[];
  tvGuide: TvGuideSlot[];
}
