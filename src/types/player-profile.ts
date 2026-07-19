/**
 * Erweitertes Spielerprofil (Übersicht + Statistik)
 */

import type { Locale } from "@/i18n/routing";

export type LocaleText = Record<Locale, string>;

export interface CareerSeasonStat {
  /** z.B. "Fußball-WM", "Serie A", "Champions League" */
  competition: LocaleText;
  /** "2026" oder "2025-26" */
  season: string;
  apps: number;
  goals: number;
  assists: number;
  yellow: number;
  red: number;
}

export interface ProfileTeamTab {
  id: string;
  /** Anzeige im Tab */
  label: LocaleText;
  stats: CareerSeasonStat[];
}

export interface ProfileMedia {
  type: "image" | "video";
  url: string;
  thumb?: string;
  caption?: LocaleText;
}

export interface PlayerProfileData {
  playerId: string;
  /** Kurz-Rolle unter dem Namen */
  role: LocaleText;
  bio: LocaleText;
  born?: string; // ISO date
  birthPlace?: LocaleText;
  currentTeams: LocaleText; // formatierter Text
  wikipediaUrl?: string;
  transfermarktUrl?: string;
  youtubeUrl?: string;
  youtubeTitle?: LocaleText;
  /** Kompakt-Stats Übersicht (z.B. letzte große Turnier-Saison) */
  highlight?: {
    label: LocaleText;
    apps: number;
    goals: number;
    assists: number;
    yellow: number;
  };
  teams: ProfileTeamTab[];
  gallery: ProfileMedia[];
}
