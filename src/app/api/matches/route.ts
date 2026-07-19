import { NextResponse } from "next/server";
import { getMatches } from "@/lib/data/service";

export const revalidate = 60;

/** GET /api/matches – alle Spiele (mit kroatischen Spielern) */
export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json({
      data: matches,
      count: matches.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load matches",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
