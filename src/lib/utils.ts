import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  isToday,
  isWithinInterval,
  addDays,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from "date-fns";
import { de, enGB, hr } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import type { DateFilter, Match, MatchFilters, MatchStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function dateFnsLocale(locale?: string | null): DateFnsLocale {
  if (locale === "en") return enGB;
  if (locale === "hr") return hr;
  return de;
}

export function formatKickoff(
  iso: string,
  pattern = "EEE, d. MMM · HH:mm",
  locale?: string | null
): string {
  try {
    return format(parseISO(iso), pattern, {
      locale: dateFnsLocale(locale),
    });
  } catch {
    return iso;
  }
}

export function formatTime(iso: string, locale?: string | null): string {
  return formatKickoff(iso, "HH:mm", locale);
}

export function formatDateShort(iso: string, locale?: string | null): string {
  return formatKickoff(iso, "d. MMM", locale);
}

export function matchesDateFilter(kickoff: string, filter: DateFilter): boolean {
  const date = parseISO(kickoff);
  const now = new Date();

  switch (filter) {
    case "today":
      return isToday(date);
    case "next7":
      return isWithinInterval(date, {
        start: startOfDay(now),
        end: endOfDay(addDays(now, 7)),
      });
    case "all":
    default:
      return true;
  }
}

/** Suche: Akzente ignorieren (Modric ≈ Modrić) */
export function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function textMatchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return normalizeSearch(text).includes(normalizeSearch(query));
}

export function filterPlayersBySearch<
  T extends {
    id: string;
    name: string;
    shortName?: string;
    club: string;
    leagueName: string;
    position: string;
    positionLabel: string;
  },
>(players: T[], search: string): T[] {
  const q = search.trim();
  if (!q) return players;
  return players.filter(
    (p) =>
      textMatchesQuery(p.name, q) ||
      textMatchesQuery(p.shortName || "", q) ||
      textMatchesQuery(p.club, q) ||
      textMatchesQuery(p.leagueName, q) ||
      textMatchesQuery(p.position, q) ||
      textMatchesQuery(p.positionLabel, q) ||
      textMatchesQuery(p.id, q)
  );
}

export function filterMatches(matches: Match[], filters: MatchFilters): Match[] {
  return matches
    .filter((m) => {
      if (filters.league === "live") {
        return m.status === "live" || m.status === "halftime";
      }
      if (filters.league !== "all" && m.league !== filters.league) {
        return false;
      }
      return true;
    })
    .filter((m) => matchesDateFilter(m.kickoff, filters.date))
    .filter((m) => {
      if (filters.playerId) {
        return m.croatianPlayers.some((p) => p.playerId === filters.playerId);
      }
      return true;
    })
    .filter((m) => {
      if (!filters.search.trim()) return true;
      const q = filters.search;
      return (
        textMatchesQuery(m.homeTeam, q) ||
        textMatchesQuery(m.awayTeam, q) ||
        textMatchesQuery(m.leagueName, q) ||
        m.croatianPlayers.some((p) => textMatchesQuery(p.playerName, q)) ||
        textMatchesQuery(m.venue || "", q)
      );
    })
    .sort((a, b) => {
      // Live first, then by kickoff
      const liveA = a.status === "live" || a.status === "halftime" ? 0 : 1;
      const liveB = b.status === "live" || b.status === "halftime" ? 0 : 1;
      if (liveA !== liveB) return liveA - liveB;
      return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
    });
}

export function statusLabel(status: MatchStatus, minute?: number | null): string {
  switch (status) {
    case "live":
      return minute != null ? `${minute}'` : "LIVE";
    case "halftime":
      return "HZ";
    case "finished":
      return "Beendet";
    case "postponed":
      return "Verschoben";
    case "cancelled":
      return "Abgesagt";
    case "scheduled":
    default:
      return "Geplant";
  }
}

export function isLiveStatus(status: MatchStatus): boolean {
  return status === "live" || status === "halftime";
}

export function scoreDisplay(home: number | null, away: number | null): string {
  if (home === null || away === null) return "– : –";
  return `${home} : ${away}`;
}

/** LocalStorage keys */
export const STORAGE_KEYS = {
  apiSettings: "ksl_api_settings",
  notifications: "ksl_notifications",
  selectedPlayer: "ksl_selected_player",
  /** User-Vorschläge bei falschem System-Status (keine Selbst-Edit) */
  statusSuggestions: "ksl_status_suggestions",
  /** Favorisierte Spieler-IDs */
  favoritePlayers: "ksl_favorite_players",
  /** Visit counter for soft PWA prompt */
  visitCount: "ksl_visit_count",
  /** PWA install hint dismissed */
  installHintDismissed: "ksl_install_hint_dismissed",
  /** Push banner dismissed (soft) */
  pushPromptDismissed: "ksl_push_prompt_dismissed",
  /** Already fired local match reminder IDs */
  matchRemindersSent: "ksl_match_reminders_sent",
} as const;

export function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
