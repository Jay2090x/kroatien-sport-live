export type MatchState = "pre" | "in" | "post" | "postponed" | "cancelled";

export interface NtMatch {
  id: string;
  /** ISO (UTC) */
  kickoff: string;
  home: string;
  away: string;
  croatiaIsHome: boolean;
  homeScore: number | null;
  awayScore: number | null;
  /** z. B. "n. E. 4:3" */
  extra?: string;
  state: MatchState;
  /** Spielminute bei Live-Spielen, z. B. "67'" oder "HZ" */
  clock?: string;
  competition: string;
  venue?: string;
}

export interface GroupRow {
  rank: number;
  team: string;
  isCroatia: boolean;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface GroupTable {
  title: string;
  rows: GroupRow[];
}
