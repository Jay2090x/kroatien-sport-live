/**
 * Kroatien Sport Live – zentrale TypeScript-Typen
 * Erweiterbar für weitere Sportarten (Handball, Basketball, …)
 */

export type MatchStatus = "scheduled" | "live" | "halftime" | "finished" | "postponed" | "cancelled";

export type LeagueId =
  | "premier-league"
  | "bundesliga"
  | "serie-a"
  | "laliga"
  | "ligue-1"
  | "hnl"
  | "nations-league"
  | "champions-league"
  | "europa-league"
  | "conference-league"
  | "world-cup"
  | "friendly"
  | "other";

export type PlayerPosition =
  | "GK"
  | "CB"
  | "LB"
  | "RB"
  | "LWB"
  | "RWB"
  | "CDM"
  | "CM"
  | "CAM"
  | "LM"
  | "RM"
  | "LW"
  | "RW"
  | "CF"
  | "ST";

/**
 * Spielverfügbarkeit – manuell pflegbar (Urlaub, Verletzung, …)
 * Überschreibbar per UI → localStorage (später Supabase)
 */
export type PlayerAvailability =
  | "available" /** fit / im Kader erwartet */
  | "vacation" /** Urlaub / Sommerpause */
  | "injured" /** verletzt */
  | "suspended" /** gesperrt */
  | "not_in_squad" /** nicht im Kader / abgestellt */
  | "doubtful"; /** fraglich / Fitness-Zweifel */

export interface Player {
  id: string;
  name: string;
  shortName?: string;
  club: string;
  clubId?: string;
  league: LeagueId;
  leagueName: string;
  position: PlayerPosition;
  positionLabel: string;
  nationality: "HR";
  shirtNumber?: number;
  imageUrl?: string;
  dateOfBirth?: string;
  /** FIFA/Transfermarkt-ID für spätere API-Anbindung */
  externalIds?: {
    theSportsDb?: string;
    footballData?: string;
    transfermarkt?: string;
  };
  /** Ob der Spieler aktuell einsatzbereit ist */
  availability?: PlayerAvailability;
  /** Freitext z.B. „Knie, ca. 2 Wochen“ */
  availabilityNote?: string;
  /** ISO-Datum wann wieder fit erwartet */
  expectedReturn?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerAvailabilityOverride {
  availability: PlayerAvailability;
  note?: string;
  expectedReturn?: string;
  updatedAt: string;
}

export interface MatchPlayerAppearance {
  playerId: string;
  playerName: string;
  teamSide: "home" | "away";
  position?: PlayerPosition;
  /** In der Startelf? */
  isStarter?: boolean;
  minutesPlayed?: number;
  goals?: number;
  assists?: number;
  /** Gelbe Karten in diesem Spiel (0–2) */
  yellowCards?: number;
  /** Rote Karte (direkt oder 2. Gelbe) */
  redCard?: boolean;
  /** Eingewechselt in Minute X */
  substitutedOn?: number | null;
  /** Ausgewechselt in Minute X */
  substitutedOff?: number | null;
  /** Erwartet im Spiel? (abgeleitet von Player.availability) */
  expectedToPlay?: boolean;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  minute?: number | null;
  kickoff: string; // ISO 8601
  league: LeagueId;
  leagueName: string;
  venue?: string;
  /** Kroatische Spieler in diesem Match */
  croatianPlayers: MatchPlayerAppearance[];
  tvChannels?: TvChannel[];
  streamHints?: string[];
  externalIds?: {
    theSportsDb?: string;
    footballData?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface TvChannel {
  id: string;
  name: string;
  type: "free" | "paid" | "streaming";
  url: string;
  logoUrl?: string;
  region?: string;
  /** Affiliate / Tracking-Hinweis */
  isAffiliate?: boolean;
}

export interface VpnProvider {
  id: string;
  name: string;
  url: string;
  description: string;
  isAffiliate: boolean;
  discountCode?: string;
}

export type DateFilter = "today" | "next7" | "all";
export type LeagueFilter = "all" | "live" | LeagueId;

export interface MatchFilters {
  league: LeagueFilter;
  date: DateFilter;
  search: string;
  playerId?: string | null;
}

export interface ApiSettings {
  theSportsDbKey: string;
  footballDataKey: string;
  onesignalAppId?: string;
  /** ISO timestamp of last save */
  updatedAt?: string;
}

export interface NotificationPreferences {
  liveGoals: boolean;
  matchStart: boolean;
  lineupAnnounced: boolean;
  favoritePlayerIds: string[];
}

export interface DashboardData {
  matches: Match[];
  players: Player[];
  lastUpdated: string;
  source: "supabase" | "fallback" | "api" | "partial" | "empty";
}

export interface RefreshResult {
  success: boolean;
  matchesUpdated: number;
  playersUpdated: number;
  source: string;
  errors?: string[];
  timestamp: string;
}
