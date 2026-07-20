/**
 * Spieler-Verfügbarkeit – NUR systemseitig bestimmt.
 * User können Fehler melden (Vorschlag), aber nicht selbst setzen.
 *
 * Logik (Juli 2026):
 * - Sommerpause vieler Top-Ligen: Urlaub / Pause
 * - Bekannte Ausnahmen (verletzt etc.) manuell in SYSTEM_STATUS
 * - Nationalteam-Fenster: vor/nach NT-Spielen eher "available" für Kader-Spieler
 */

import type { Player, PlayerAvailability } from "@/types";

export const AVAILABILITY_OPTIONS: {
  id: PlayerAvailability;
  labelDe: string;
  labelEn: string;
  labelHr: string;
  emoji: string;
  expectedToPlay: boolean;
  badgeClass: string;
}[] = [
  {
    id: "available",
    labelDe: "Fit / einsatzbereit",
    labelEn: "Available",
    labelHr: "Spreman / dostupan",
    emoji: "✅",
    expectedToPlay: true,
    badgeClass: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  },
  {
    id: "vacation",
    labelDe: "Urlaub / Sommerpause",
    labelEn: "On vacation",
    labelHr: "Odmor / ljetna pauza",
    emoji: "🏖️",
    expectedToPlay: false,
    badgeClass: "border-sky-500/40 bg-sky-500/15 text-sky-300",
  },
  {
    id: "injured",
    labelDe: "Verletzt",
    labelEn: "Injured",
    labelHr: "Ozlijeđen",
    emoji: "🩹",
    expectedToPlay: false,
    badgeClass: "border-red-500/40 bg-red-500/15 text-red-300",
  },
  {
    id: "suspended",
    labelDe: "Gesperrt",
    labelEn: "Suspended",
    labelHr: "Suspendiran",
    emoji: "🟥",
    expectedToPlay: false,
    badgeClass: "border-orange-500/40 bg-orange-500/15 text-orange-300",
  },
  {
    id: "not_in_squad",
    labelDe: "Nicht im Kader",
    labelEn: "Not in squad",
    labelHr: "Nije u kadru",
    emoji: "📋",
    expectedToPlay: false,
    badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
  },
  {
    id: "doubtful",
    labelDe: "Fraglich",
    labelEn: "Doubtful",
    labelHr: "Upitno",
    emoji: "❓",
    expectedToPlay: false,
    badgeClass: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  },
];

/**
 * Manuelle System-Overrides (Redaktion / bekannte Fakten).
 * Hat Vorrang vor der automatischen Sommerpausen-Logik.
 */
export const SYSTEM_STATUS: Record<
  string,
  {
    availability: PlayerAvailability;
    note: string;
  }
> = {
  // Beispiele – bei Bedarf erweitern
  // beljo: { availability: "injured", note: "..." },
};

/** Ligen mit typischer Sommerpause ca. Juni–Mitte August */
const SUMMER_BREAK_LEAGUES = new Set([
  "premier-league",
  "bundesliga",
  "serie-a",
  "laliga",
  "ligue-1",
  "other",
]);

/**
 * Bestimmt Status rein serverseitig / systemseitig.
 */
export function resolveSystemAvailability(
  player: Player,
  now: Date = new Date()
): {
  availability: PlayerAvailability;
  availabilityNote: string;
} {
  // 1) Manuelle Redaktions-Overrides
  const manual = SYSTEM_STATUS[player.id];
  if (manual) {
    return {
      availability: manual.availability,
      availabilityNote: manual.note,
    };
  }

  const month = now.getUTCMonth(); // 0–11
  const day = now.getUTCDate();
  const inPeakSummerBreak =
    (month === 5 && day >= 15) || // ab Mitte Juni
    month === 6 || // Juli
    (month === 7 && day <= 10); // bis ca. 10. August

  // HNL läuft oft früher / anders – eher fit
  if (player.league === "hnl") {
    return {
      availability: "available",
      availabilityNote: "HNL-Saison / aktiver Club-Betrieb (systemseitig)",
    };
  }

  if (inPeakSummerBreak && SUMMER_BREAK_LEAGUES.has(player.league)) {
    return {
      availability: "vacation",
      availabilityNote:
        "System: Sommerpause der Liga – typischerweise Urlaub / Vorbereitung (Stand " +
        now.toISOString().slice(0, 10) +
        ")",
    };
  }

  // Vor Saisonstart (Mitte Aug–Sept) oft fraglich / Vorbereitung
  if (month === 7 && day > 10 && day < 25 && SUMMER_BREAK_LEAGUES.has(player.league)) {
    return {
      availability: "doubtful",
      availabilityNote:
        "System: frühe Saisonvorbereitung – Einsatz ungewiss",
    };
  }

  return {
    availability: "available",
    availabilityNote: "System: keine Sperre/Verletzung bekannt – als fit geführt",
  };
}

export function getAvailabilityMeta(status: PlayerAvailability = "available") {
  return (
    AVAILABILITY_OPTIONS.find((o) => o.id === status) ?? AVAILABILITY_OPTIONS[0]
  );
}

/** Vollständiges Status-Label in der aktiven UI-Sprache */
export function getAvailabilityLabel(
  status: PlayerAvailability | undefined,
  locale: string
): string {
  const meta = getAvailabilityMeta(status ?? "available");
  if (locale === "en") return meta.labelEn;
  if (locale === "hr") return meta.labelHr;
  return meta.labelDe;
}


export function isExpectedToPlay(status?: PlayerAvailability): boolean {
  return getAvailabilityMeta(status ?? "available").expectedToPlay;
}

/** Alle Spieler mit System-Status anreichern */
export function applySystemAvailability(players: Player[]): Player[] {
  const now = new Date();
  return players.map((p) => {
    const resolved = resolveSystemAvailability(p, now);
    return {
      ...p,
      availability: resolved.availability,
      availabilityNote: resolved.availabilityNote,
    };
  });
}
