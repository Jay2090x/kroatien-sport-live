import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/service";
import { buildTvSchedule } from "@/lib/data/tv-schedule";

export const dynamic = "force-dynamic";
export const revalidate = 120;

/**
 * GET /api/tv-guide?locale=de&market=HR
 * Returns today's TV slots derived from live fixtures + light scaffolding.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") || "de";
  const market =
    searchParams.get("market") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

  try {
    const data = await getDashboardData();
    const slots = buildTvSchedule({
      matches: data.matches,
      locale,
      market: market && market !== "XX" ? market.toUpperCase() : null,
      includeScaffold: true,
    });

    return NextResponse.json(
      {
        updatedAt: new Date().toISOString(),
        source: "live-matches+scaffold",
        market: market?.toUpperCase() ?? null,
        slots,
        matchCount: data.matches.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "tv-guide failed",
        slots: [],
      },
      { status: 500 }
    );
  }
}
