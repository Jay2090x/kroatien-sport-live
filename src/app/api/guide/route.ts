import { NextRequest, NextResponse } from "next/server";
import { getDashboardData } from "@/lib/data/service";
import { getGuideCatalog } from "@/lib/data/guide-catalog";
import { mergeGuideWithLive } from "@/lib/data/merge-guide-live";
import { buildTvSchedule } from "@/lib/data/tv-schedule";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * GET /api/guide?locale=de
 * Unified guide payload: merged matches + TV schedule.
 */
export async function GET(req: NextRequest) {
  const locale = new URL(req.url).searchParams.get("locale") || "de";
  const market =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    null;

  try {
    const [data, catalog] = await Promise.all([
      getDashboardData(),
      Promise.resolve(getGuideCatalog()),
    ]);

    const matches = mergeGuideWithLive(
      catalog.matches,
      data.matches,
      locale,
      data.players
    );

    const tvGuide = buildTvSchedule({
      matches: data.matches,
      locale,
      market: market && market !== "XX" ? market.toUpperCase() : null,
    });

    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: data.source,
      matches,
      tvGuide,
      liveApiMatches: data.matches.length,
      catalogMatches: catalog.matches.length,
    });
  } catch (e) {
    const catalog = getGuideCatalog();
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      source: "catalog-fallback",
      matches: catalog.matches,
      tvGuide: catalog.tvGuide,
      error: e instanceof Error ? e.message : "guide failed",
    });
  }
}
