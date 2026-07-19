import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/data/service";

export const revalidate = 300;

/** GET /api/players – kroatische Spieler im Tracker */
export async function GET() {
  try {
    const players = await getPlayers();
    return NextResponse.json({
      data: players,
      count: players.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load players",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
