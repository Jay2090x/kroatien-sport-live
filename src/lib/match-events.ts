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

type EventLocale = "de" | "en" | "hr";

function normalizeEventLocale(locale?: string): EventLocale {
  if (locale === "en" || locale === "hr") return locale;
  return "de";
}

/** Kompakte Event-Icons für Match-Karten */
export function buildEventChips(
  app: MatchPlayerAppearance,
  locale: string = "de"
): MatchEventChip[] {
  const l = normalizeEventLocale(locale);
  const chips: MatchEventChip[] = [];

  if (app.goals && app.goals > 0) {
    chips.push({
      key: "goals",
      label: app.goals > 1 ? `⚽×${app.goals}` : "⚽",
      title:
        l === "hr"
          ? `${app.goals} gol${app.goals > 1 ? "a" : ""}`
          : l === "en"
            ? `${app.goals} goal${app.goals > 1 ? "s" : ""}`
            : `${app.goals} Tor${app.goals > 1 ? "e" : ""}`,
    });
  }

  if (app.assists && app.assists > 0) {
    chips.push({
      key: "assists",
      label: app.assists > 1 ? `🅰️×${app.assists}` : "🅰️",
      title:
        l === "hr"
          ? `${app.assists} asistencij${app.assists > 1 ? "e" : "a"}`
          : l === "en"
            ? `${app.assists} assist${app.assists > 1 ? "s" : ""}`
            : `${app.assists} Vorlage${app.assists > 1 ? "n" : ""}`,
    });
  }

  if (app.yellowCards && app.yellowCards > 0) {
    chips.push({
      key: "yellow",
      label: app.yellowCards > 1 ? "🟨🟨" : "🟨",
      title:
        l === "hr"
          ? `${app.yellowCards} žuti karton${app.yellowCards > 1 ? "a" : ""}`
          : l === "en"
            ? `${app.yellowCards} yellow card${app.yellowCards > 1 ? "s" : ""}`
            : `${app.yellowCards} Gelbe Karte${app.yellowCards > 1 ? "n" : ""}`,
      className: "text-amber-300",
    });
  }

  if (app.redCard) {
    chips.push({
      key: "red",
      label: "🟥",
      title: l === "hr" ? "Crveni karton" : l === "en" ? "Red card" : "Rote Karte",
      className: "text-red-400",
    });
  }

  if (app.substitutedOff != null) {
    chips.push({
      key: "sub-off",
      label: `↓${app.substitutedOff}'`,
      title:
        l === "hr"
          ? `Izmijenjen (${app.substitutedOff}.)`
          : l === "en"
            ? `Substituted off (${app.substitutedOff}')`
            : `Ausgewechselt (${app.substitutedOff}.)`,
      className: "text-orange-300",
    });
  }

  if (app.substitutedOn != null) {
    chips.push({
      key: "sub-on",
      label: `↑${app.substitutedOn}'`,
      title:
        l === "hr"
          ? `Ušao (${app.substitutedOn}.)`
          : l === "en"
            ? `Substituted on (${app.substitutedOn}')`
            : `Eingewechselt (${app.substitutedOn}.)`,
      className: "text-emerald-300",
    });
  }

  if (app.isStarter === false && app.substitutedOn == null && app.minutesPlayed == null) {
    chips.push({
      key: "bench",
      label: l === "hr" ? "Klupa" : l === "en" ? "Bench" : "Bank",
      title:
        l === "hr" ? "Na klupi" : l === "en" ? "On the bench" : "Auf der Bank",
      className: "text-muted-foreground",
    });
  }

  if (app.minutesPlayed != null && app.minutesPlayed > 0) {
    chips.push({
      key: "mins",
      label: `${app.minutesPlayed}'`,
      title:
        l === "hr"
          ? `${app.minutesPlayed} minuta na terenu`
          : l === "en"
            ? `${app.minutesPlayed} minutes played`
            : `${app.minutesPlayed} Minuten gespielt`,
      className: "text-muted-foreground",
    });
  }

  return chips;
}

export function hasMatchEvents(app: MatchPlayerAppearance): boolean {
  return buildEventChips(app).length > 0;
}
