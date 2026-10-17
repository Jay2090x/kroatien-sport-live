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

/** Offset von Wien zu UTC in Minuten zum Zeitpunkt `ms` (z. B. 120 im Sommer). */
export function viennaOffsetMin(ms: number): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, timeZoneName: "shortOffset" }).formatToParts(
    new Date(ms)
  );
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const v = Number(m[2]) * 60 + Number(m[3] ?? 0);
  return m[1] === "-" ? -v : v;
}

/** UTC-Millisekunden für 00:00 Uhr Wiener Zeit am Kalendertag "YYYY-MM-DD". */
export function viennaMidnight(ymd: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d);
  let t = guess - viennaOffsetMin(guess) * 60_000;
  t = guess - viennaOffsetMin(t) * 60_000; // DST-Grenze nachjustieren
  return t;
}

/** Wochentag in Wien (0 = Sonntag … 6 = Samstag). */
export function viennaWeekday(ms: number): number {
  const ymd = viennaYmd(new Date(ms).toISOString());
  const [y, mo, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

/** "YYYY-MM-DD" + n Tage */
export function addDaysYmd(ymd: string, n: number): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
}
