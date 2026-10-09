import { TIME_ZONE } from "./site";
import { localeOf, type Lang } from "./i18n";

function fmt(iso: string, opts: Intl.DateTimeFormatOptions, lang: Lang = "de"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(localeOf(lang), { timeZone: TIME_ZONE, ...opts }).format(d);
}

/** "Do., 12. Nov., 20:45" */
export function formatKickoff(iso: string, lang: Lang = "de"): string {
  return fmt(iso, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }, lang);
}

/** "Do., 12. Nov." */
export function formatDay(iso: string, lang: Lang = "de"): string {
  return fmt(iso, { weekday: "short", day: "numeric", month: "short" }, lang);
}

/** "Donnerstag, 12. November" */
export function formatLongDay(iso: string, lang: Lang = "de"): string {
  return fmt(iso, { weekday: "long", day: "numeric", month: "long" }, lang);
}

/** "12.11.26" */
export function formatShortDate(iso: string, lang: Lang = "de"): string {
  return fmt(iso, { day: "2-digit", month: "2-digit", year: "2-digit" }, lang);
}

/** "20:45" */
export function formatTime(iso: string, lang: Lang = "de"): string {
  return fmt(iso, { hour: "2-digit", minute: "2-digit" }, lang);
}

/** "08.10., 14:20" */
export function formatStand(iso: string, lang: Lang = "de"): string {
  return fmt(iso, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }, lang);
}

/** Kalendertag in Wien als "YYYY-MM-DD" (für Sortierung/Gruppierung). */
export function viennaYmd(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "9999-12-31";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
