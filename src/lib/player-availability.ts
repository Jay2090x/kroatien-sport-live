/**
 * Spieler-Verfügbarkeit – ehrlich, mit Quelle und Konfidenz.
 *
 * Wir behaupten KEINE Fitness ohne Beleg.
 * Priorität:
 * 1) Editorial SYSTEM_STATUS (confirmed) – z.B. Verletzung
 * 2) Live-Spiel mit Spieler im Feed → im Einsatz (likely)
 * 3) Spielplan: Club-Spiel in den nächsten 14 Tagen gelistet → „im Spielplan“ (likely)
 * 4) Saisonpause ohne Termin → Pause (likely, Kalender)
 * 5) default: unknown
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
    labelDe: "Im Spielplan / einsatzbereit",
    labelEn: "In squad / available",
    labelHr: "U rasporedu / dostupan",
    shortDe: "Plan",
    shortEn: "Listed",
    shortHr: "Rasp.",
    emoji: "●",
    expectedToPlay: true,
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  {
    id: "vacation",
    labelDe: "Urlaub / Saisonpause",
    labelEn: "Break / off-season",
    labelHr: "Odmor / pauza",
    shortDe: "Pause",
    shortEn: "Off",
    shortHr: "Odmor",
    emoji: "○",
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
    emoji: "!",
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
    emoji: "!",
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
    emoji: "–",
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
    emoji: "?",
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
 * Manuelle Redaktions-Overrides – nur bei belegten Fakten.
 * Ohne Quelle bleibt der Status „unknown“ / Spielplan-Signal.
 */
export const SYSTEM_STATUS: Record<
  string,
  {
    availability: PlayerAvailability;
    note: string;
  }
> = {
  // Beispiel: nur pflegen wenn redaktionell bestätigt
  // "player-id": { availability: "injured", note: "Knie – Club-Meldung TT.MM.JJJJ" },
};

/** Monat 0–11: typische Sommerpause (likely, nicht confirmed) */
const SUMMER_BREAK: Partial<
  Record<
    LeagueId,
    { startMonth: number; startDay: number; endMonth: number; endDay: number }
  >
> = {
  "premier-league": { startMonth: 5, startDay: 20, endMonth: 7, endDay: 12 },
  bundesliga: { startMonth: 5, startDay: 20, endMonth: 7, endDay: 15 },
  "serie-a": { startMonth: 5, startDay: 25, endMonth: 7, endDay: 15 },
  laliga: { startMonth: 5, startDay: 25, endMonth: 7, endDay: 12 },
  "ligue-1": { startMonth: 5, startDay: 20, endMonth: 7, endDay: 12 },
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

export type MatchListing = {
  liveNow: boolean;
  upcomingWithinDays: boolean;
  nextKickoff?: string;
};

export function getPlayerMatchListing(
  playerId: string,
  matches: Match[] | undefined,
  now: Date = new Date(),
  withinDays = 14
): MatchListing {
  if (!matches?.length) {
    return { liveNow: false, upcomingWithinDays: false };
  }
  const horizon = now.getTime() + withinDays * 24 * 3600 * 1000;
  let liveNow = false;
  let upcomingWithinDays = false;
  let nextKickoff: string | undefined;

  for (const m of matches) {
    if (!m.croatianPlayers.some((p) => p.playerId === playerId)) continue;
    const t = new Date(m.kickoff).getTime();
    if (Number.isNaN(t)) continue;

    if (m.status === "live" || m.status === "halftime") {
      liveNow = true;
      if (!nextKickoff || t < new Date(nextKickoff).getTime()) {
        nextKickoff = m.kickoff;
      }
      continue;
    }

    if (
      (m.status === "scheduled" || m.status === "postponed") &&
      t >= now.getTime() - 2 * 3600 * 1000 &&
      t <= horizon
    ) {
      upcomingWithinDays = true;
      if (!nextKickoff || t < new Date(nextKickoff).getTime()) {
        nextKickoff = m.kickoff;
      }
    }
  }

  return { liveNow, upcomingWithinDays, nextKickoff };
}

export function resolveSystemAvailability(
  player: Player,
  now: Date = new Date(),
  ctx?: MatchListing
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

  // Live im Feed = stärkstes automatisches Signal
  if (ctx?.liveNow) {
    return {
      availability: "available",
      availabilityNote:
        "Aktuell in einem Live-Spiel der Datenquelle gelistet (kein medizinischer Befund).",
      confidence: "likely",
      source: "match_signal",
    };
  }

  // Spielplan: in den nächsten 14 Tagen einem Club-Spiel zugeordnet
  if (ctx?.upcomingWithinDays) {
    return {
      availability: "available",
      availabilityNote:
        "In den nächsten 14 Tagen einem Club-Spiel in unseren Daten zugeordnet – kein bestätigter Fitness-Status.",
      confidence: "likely",
      source: "match_signal",
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
    return {
      availability: "vacation",
      availabilityNote: `Typische Saisonpause ${player.leagueName} (Kalender-Schätzung ${now
        .toISOString()
        .slice(0, 10)}) – kein bestätigter Fitness-Status.`,
      confidence: "likely",
      source: "season_calendar",
    };
  }

  return {
    availability: "unknown",
    availabilityNote:
      "Keine redaktionelle Meldung und kein Spielplan-Eintrag in den nächsten 14 Tagen – wir spekulieren nicht.",
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

/** Display short that reflects source honesty */
export function getAvailabilityDisplayShort(
  player: Pick<
    Player,
    "availability" | "availabilitySource" | "availabilityConfidence"
  >,
  locale: string
): string {
  const status = player.availability ?? "unknown";
  const src = player.availabilitySource;
  if (status === "available" && src === "match_signal") {
    if (locale === "en") return "Listed";
    if (locale === "hr") return "Na listi";
    return "Gelistet";
  }
  if (status === "available" && src === "editorial") {
    if (locale === "en") return "Fit";
    if (locale === "hr") return "Spreman";
    return "Fit";
  }
  return getAvailabilityShort(status, locale);
}

export function isExpectedToPlay(status?: PlayerAvailability): boolean {
  if (!status || status === "unknown") return false;
  return getAvailabilityMeta(status).expectedToPlay;
}

/** Alle Spieler mit System-Status anreichern */
export function applySystemAvailability(
  players: Player[],
  matches?: Match[]
): Player[] {
  const now = new Date();
  return players.map((p) => {
    const listing = getPlayerMatchListing(p.id, matches, now, 14);
    const resolved = resolveSystemAvailability(p, now, listing);
    return {
      ...p,
      availability: resolved.availability,
      availabilityNote: resolved.availabilityNote,
      availabilityConfidence: resolved.confidence,
      availabilitySource: resolved.source,
    };
  });
}
