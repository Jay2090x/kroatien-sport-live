import { TIME_ZONE } from "./site";

const LOCALE = "de-DE";

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...opts }).format(d);
}

/** "Do., 12. Nov., 20:45" */
export function formatKickoff(iso: string): string {
  return fmt(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Do., 12. Nov." */
export function formatDay(iso: string): string {
  return fmt(iso, { weekday: "short", day: "numeric", month: "short" });
}

/** "12.11.26" */
export function formatShortDate(iso: string): string {
  return fmt(iso, { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** "20:45" */
export function formatTime(iso: string): string {
  return fmt(iso, { hour: "2-digit", minute: "2-digit" });
}

/** "Stand: 08.10., 14:20" */
export function formatStand(iso: string): string {
  return fmt(iso, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
