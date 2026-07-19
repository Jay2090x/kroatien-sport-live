import { NextResponse } from "next/server";
import { getLiveData } from "@/lib/data/service";

/**
 * GET /api/live – frische Live-Daten (Spieler + Matches)
 * Wird vom Client alle 2 Min. und per „Aktualisieren“ aufgerufen.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await getLiveData();
    return NextResponse.json(
      {
        matches: data.matches,
        players: data.players,
        source: data.source,
        lastUpdated: new Date().toISOString(),
        count: {
          matches: data.matches.length,
          players: data.players.length,
        },
        errors: data.errors,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Live fetch failed",
        message: error instanceof Error ? error.message : "Unknown",
        matches: [],
        players: [],
      },
      { status: 500 }
    );
  }
}
