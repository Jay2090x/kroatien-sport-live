import { NextResponse, type NextRequest } from "next/server";
import { getDailyNewsAsync } from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";
export const revalidate = 900;

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("locale");
    const locale: Locale =
      q === "en" || q === "hr" ? q : "de";

    let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
    let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
    try {
      const data = await getDashboardData();
      matches = data.matches;
      players = data.players;
    } catch {
      /* editorial + auto still ok */
    }
    const articles = await getDailyNewsAsync(
      new Date(),
      { matches, players },
      locale
    );
    return NextResponse.json(
      {
        articles,
        updatedAt: new Date().toISOString(),
        meta: {
          count: articles.length,
          locale,
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
