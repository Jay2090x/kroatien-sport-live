import { europeCalendar } from "@/lib/fan/calendars";

/** Abonnierbarer Kalender (iCalendar). CDN-Cache 1 h – Kalender-Apps fragen ohnehin nur alle paar Stunden. */
export const revalidate = 3600;

export async function GET() {
  const cal = await europeCalendar();
  if (!cal) return new Response("Kalender derzeit nicht verfügbar / Kalendar trenutačno nije dostupan", { status: 503 });
  return new Response(cal.ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="europacup.ics"',
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
