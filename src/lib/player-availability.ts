/**
 * Spieler-Verfügbarkeit – systemseitig, mit Konfidenz.
 * User melden nur Vorschläge; kein Self-Edit.
 *
 * Priorität:
 * 1) Editorial SYSTEM_STATUS (confirmed)
 * 2) Saisonkalender pro Liga (likely vacation / unknown)
 * 3) Match-Signal: Club-Spiel in 14 Tagen (likely available)
 * 4) default: unknown (kein falsches Grün)
 */

import type {
  AvailabilityConfidence,
  AvailabilitySource,
  LeagueId,
  Match,
  Player,
  PlayerAvailability,
} from "@/types";

export const AVAILABILITY_OPTIONS: {
  id: PlayerAvailability;
  labelDe: string;
  labelEn: string;
  labelHr: string;
  shortDe: string;
  shortEn: string;
  shortHr: string;
  emoji: string;
  expectedToPlay: boolean;
  badgeClass: string;
}[] = [
  {
    id: "available",
    labelDe: "Fit / einsatzbereit",
    labelEn: "Available",
    labelHr: "Spreman / dostupan",
    shortDe: "Fit",
    shortEn: "Fit",
    shortHr: "Spreman",
    emoji: "✅",
    expectedToPlay: true,
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  {
    id: "vacation",
    labelDe: "Urlaub / Sommerpause",
    labelEn: "On vacation / break",
    labelHr: "Odmor / pauza",
    shortDe: "Pause",
    shortEn: "Off",
    shortHr: "Odmor",
    emoji: "🏖️",
    expectedToPlay: false,
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  },
  {
    id: "injured",
    labelDe: "Verletzt",
    labelEn: "Injured",
    labelHr: "Ozlijeđen",
    shortDe: "Verletzt",
    shortEn: "Injured",
    shortHr: "Ozljeda",
    emoji: "🩹",
    expectedToPlay: false,
    badgeClass: "border-red-500/40 bg-red-500/15 text-red-300",
  },
  {
    id: "suspended",
    labelDe: "Gesperrt",
    labelEn: "Suspended",
    labelHr: "Suspendiran",
    shortDe: "Gesperrt",
    shortEn: "Banned",
    shortHr: "Susp.",
    emoji: "🟥",
    expectedToPlay: false,
    badgeClass: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  },
  {
    id: "not_in_squad",
    labelDe: "Nicht im Kader",
    labelEn: "Not in squad",
    labelHr: "Nije u kadru",
    shortDe: "Kader",
    shortEn: "Squad",
    shortHr: "Kadar",
    emoji: "📋",
    expectedToPlay: false,
    badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
  },
  {
    id: "doubtful",
    labelDe: "Fraglich",
    labelEn: "Doubtful",
    labelHr: "Upitno",
    shortDe: "Fraglich",
    shortEn: "Doubt",
    shortHr: "Upitno",
    emoji: "❓",
    expectedToPlay: false,
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
  {
    id: "unknown",
    labelDe: "Status unklar",
    labelEn: "Status unclear",
    labelHr: "Status nejasan",
    shortDe: "Unklar",
    shortEn: "N/A",
    shortHr: "Nejasno",
    emoji: "·",
    expectedToPlay: false,
    badgeClass: "border-border bg-secondary/60 text-muted-foreground",
  },
];

/**
 * Manuelle Redaktions-Overrides – confirmed.
 * Bei bekannten Fakten pflegen.
 */
export const SYSTEM_STATUS: Record<
  string,
  {
    availability: PlayerAvailability;
    note: string;
  }
> = {
  // Beispiele / Platzhalter – bei bestätigten News erweitern
};

/** Monat 0–11: typische Sommerpause (likely, nicht confirmed) */
const SUMMER_BREAK: Partial<
  Record<LeagueId, { startMonth: number; startDay: number; endMonth: number; endDay: number }>
> = {
  "premier-league": { startMonth: 5, startDay: 20, endMonth: 7, endDay: 12 },
  bundesliga: { startMonth: 5, startDay: 20, endMonth: 7, endDay: 15 },
  "serie-a": { startMonth: 5, startDay: 25, endMonth: 7, endDay: 15 },
  laliga: { startMonth: 5, startDay: 25, endMonth: 7, endDay: 12 },
  "ligue-1": { startMonth: 5, startDay: 20, endMonth: 7, endDay: 12 },
  // HNL oft früher unterwegs – engeres Fenster
  hnl: { startMonth: 5, startDay: 25, endMonth: 6, endDay: 25 },
};

function dayOfYear(month: number, day: number): number {
  return month * 31 + day;
}

function inRange(
  now: Date,
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number
): boolean {
  const n = dayOfYear(now.getUTCMonth(), now.getUTCDate());
  const a = dayOfYear(startMonth, startDay);
  const b = dayOfYear(endMonth, endDay);
  if (a <= b) return n >= a && n <= b;
  return n >= a || n <= b;
}

export type ResolvedAvailability = {
  availability: PlayerAvailability;
  availabilityNote: string;
  confidence: AvailabilityConfidence;
  source: AvailabilitySource;
};

export function resolveSystemAvailability(
  player: Player,
  now: Date = new Date(),
  ctx?: { upcomingMatchWithinDays?: boolean }
): ResolvedAvailability {
  const manual = SYSTEM_STATUS[player.id];
  if (manual) {
    return {
      availability: manual.availability,
      availabilityNote: manual.note,
      confidence: "confirmed",
      source: "editorial",
    };
  }

  const breakWin = SUMMER_BREAK[player.league];
  if (
    breakWin &&
    inRange(
      now,
      breakWin.startMonth,
      breakWin.startDay,
      breakWin.endMonth,
      breakWin.endDay
    )
  ) {
    // Match-Signal bricht reines Vacation-Guess
    if (ctx?.upcomingMatchWithinDays) {
      return {
        availability: "available",
        availabilityNote:
          "Club-Spiel in den nächsten 14 Tagen geplant – Einsatz eher möglich (nicht bestätigt).",
        confidence: "likely",
        source: "match_signal",
      };
    }
    return {
      availability: "vacation",
      availabilityNote: `Saisonpause ${player.leagueName} (Kalender-Schätzung, Stand ${now
        .toISOString()
        .slice(0, 10)}) – kein bestätigter Fitness-Status.`,
      confidence: "likely",
      source: "season_calendar",
    };
  }

  if (ctx?.upcomingMatchWithinDays) {
    return {
      availability: "available",
      availabilityNote:
        "Anstehendes Club-Spiel in den Daten – Fitness nicht einzeln verifiziert.",
      confidence: "likely",
      source: "match_signal",
    };
  }

  return {
    availability: "unknown",
    availabilityNote:
      "Keine redaktionelle oder kalendarische Bestätigung – Status unklar.",
    confidence: "unknown",
    source: "default",
  };
}

export function getAvailabilityMeta(
  status: PlayerAvailability = "unknown"
) {
  return (
    AVAILABILITY_OPTIONS.find((o) => o.id === status) ??
    AVAILABILITY_OPTIONS.find((o) => o.id === "unknown")!
  );
}

export function getAvailabilityLabel(
  status: PlayerAvailability | undefined,
  locale: string
): string {
  const meta = getAvailabilityMeta(status ?? "unknown");
  if (locale === "en") return meta.labelEn;
  if (locale === "hr") return meta.labelHr;
  return meta.labelDe;
}

export function getAvailabilityShort(
  status: PlayerAvailability | undefined,
  locale: string
): string {
  const meta = getAvailabilityMeta(status ?? "unknown");
  if (locale === "en") return meta.shortEn;
  if (locale === "hr") return meta.shortHr;
  return meta.shortDe;
}

export function isExpectedToPlay(status?: PlayerAvailability): boolean {
  if (!status || status === "unknown") return false;
  return getAvailabilityMeta(status).expectedToPlay;
}

function playerHasUpcomingMatch(
  playerId: string,
  matches: Match[] | undefined,
  now: Date,
  withinDays = 14
): boolean {
  if (!matches?.length) return false;
  const horizon = now.getTime() + withinDays * 24 * 3600 * 1000;
  return matches.some((m) => {
    if (m.status !== "scheduled" && m.status !== "postponed") return false;
    const t = new Date(m.kickoff).getTime();
    if (t < now.getTime() || t > horizon) return false;
    return m.croatianPlayers.some((p) => p.playerId === playerId);
  });
}

/** Alle Spieler mit System-Status anreichern */
export function applySystemAvailability(
  players: Player[],
  matches?: Match[]
): Player[] {
  const now = new Date();
  return players.map((p) => {
    const upcoming = playerHasUpcomingMatch(p.id, matches, now);
    const resolved = resolveSystemAvailability(p, now, {
      upcomingMatchWithinDays: upcoming,
    });
    return {
      ...p,
      availability: resolved.availability,
      availabilityNote: resolved.availabilityNote,
      availabilityConfidence: resolved.confidence,
      availabilitySource: resolved.source,
    };
  });
}
