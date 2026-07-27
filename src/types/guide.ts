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
  /** ISO countries where stream works without VPN */
  availableIn: string[];
  /** If true, show VPN affiliate box when user is outside availableIn */
  geoLockedOutside?: boolean;
  type: "free" | "paid" | "streaming";
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
  /** Optional deep-link into app match id */
  appMatchId?: string;
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
