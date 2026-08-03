import { NextResponse } from "next/server";
import { getDailyNewsAsync } from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";

export const dynamic = "force-dynamic";
export const revalidate = 900;

export async function GET() {
  try {
    let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
    let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
    try {
      const data = await getDashboardData();
      matches = data.matches;
      players = data.players;
    } catch {
      /* editorial + auto still ok */
    }
    const articles = await getDailyNewsAsync(new Date(), { matches, players });
    return NextResponse.json(
      {
        articles,
        updatedAt: new Date().toISOString(),
        meta: {
          count: articles.length,
          sources:
            "daily-brief + whitelist RSS (Index/HRT/HNS/ESPN/…) + editorial",
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
        },
      }
    );
  } catch (e) {
    console.error("[api/news]", e);
    return NextResponse.json({ articles: [], error: "news_failed" }, { status: 500 });
  }
}
