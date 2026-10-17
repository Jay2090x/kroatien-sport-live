import { NextResponse, type NextRequest } from "next/server";
import { getLiveOverview, getTicker } from "@/lib/sources/live";

/**
 * GET /api/live?event=<ESPN-ID>
 * Liefert den Ticker eines Kroatien-Spiels. CDN-Cache 60 s, damit viele Leser
 * nur ein paar Funktionsaufrufe pro Minute auslösen (Free-Plan-schonend).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("event");
  let eventId = q && /^\d{1,12}$/.test(q) ? q : null;
  if (!eventId) {
    const ov = await getLiveOverview();
    eventId = ov?.active?.eventId ?? ov?.last?.eventId ?? null;
  }
  const ticker = eventId ? await getTicker(eventId) : null;
  if (!ticker) {
    return NextResponse.json(
      { ticker: null },
      { status: eventId ? 404 : 503, headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
  const live = ticker.state === "in" || (ticker.state === "pre" && Date.parse(ticker.kickoff) - Date.now() < 2 * 3600_000);
  return NextResponse.json(
    { ticker },
    {
      headers: {
        "Cache-Control": live
          ? "public, max-age=0, s-maxage=60, stale-while-revalidate=60"
          : "public, max-age=300, s-maxage=3600, stale-while-revalidate=600",
      },
    }
  );
}
