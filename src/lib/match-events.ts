/**
 * Match-Events für kroatische Spieler (Tore, Karten, Auswechslungen)
 */

import type { MatchPlayerAppearance } from "@/types";

export interface MatchEventChip {
  key: string;
  label: string;
  title: string;
  className?: string;
}

/** Kompakte Event-Icons für Match-Karten */
export function buildEventChips(
  app: MatchPlayerAppearance,
  locale: "de" | "en" = "de"
): MatchEventChip[] {
  const de = locale === "de";
  const chips: MatchEventChip[] = [];

  if (app.goals && app.goals > 0) {
    chips.push({
      key: "goals",
      label: app.goals > 1 ? `⚽×${app.goals}` : "⚽",
      title: de
        ? `${app.goals} Tor${app.goals > 1 ? "e" : ""}`
        : `${app.goals} goal${app.goals > 1 ? "s" : ""}`,
    });
  }

  if (app.assists && app.assists > 0) {
    chips.push({
      key: "assists",
      label: app.assists > 1 ? `🅰️×${app.assists}` : "🅰️",
      title: de
        ? `${app.assists} Vorlage${app.assists > 1 ? "n" : ""}`
        : `${app.assists} assist${app.assists > 1 ? "s" : ""}`,
    });
  }

  if (app.yellowCards && app.yellowCards > 0) {
    chips.push({
      key: "yellow",
      label: app.yellowCards > 1 ? "🟨🟨" : "🟨",
      title: de
        ? `${app.yellowCards} Gelbe Karte${app.yellowCards > 1 ? "n" : ""}`
        : `${app.yellowCards} yellow card${app.yellowCards > 1 ? "s" : ""}`,
      className: "text-amber-300",
    });
  }

  if (app.redCard) {
    chips.push({
      key: "red",
      label: "🟥",
      title: de ? "Rote Karte" : "Red card",
      className: "text-red-400",
    });
  }

  if (app.substitutedOff != null) {
    chips.push({
      key: "sub-off",
      label: `↓${app.substitutedOff}'`,
      title: de
        ? `Ausgewechselt (${app.substitutedOff}.)`
        : `Substituted off (${app.substitutedOff}')`,
      className: "text-orange-300",
    });
  }

  if (app.substitutedOn != null) {
    chips.push({
      key: "sub-on",
      label: `↑${app.substitutedOn}'`,
      title: de
        ? `Eingewechselt (${app.substitutedOn}.)`
        : `Substituted on (${app.substitutedOn}')`,
      className: "text-emerald-300",
    });
  }

  if (app.isStarter === false && app.substitutedOn == null && app.minutesPlayed == null) {
    chips.push({
      key: "bench",
      label: de ? "Bank" : "Bench",
      title: de ? "Auf der Bank" : "On the bench",
      className: "text-muted-foreground",
    });
  }

  if (app.minutesPlayed != null && app.minutesPlayed > 0) {
    chips.push({
      key: "mins",
      label: `${app.minutesPlayed}'`,
      title: de
        ? `${app.minutesPlayed} Minuten gespielt`
        : `${app.minutesPlayed} minutes played`,
      className: "text-muted-foreground",
    });
  }

  return chips;
}

export function hasMatchEvents(app: MatchPlayerAppearance): boolean {
  return buildEventChips(app).length > 0;
}
