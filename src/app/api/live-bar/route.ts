import { NextResponse, type NextRequest } from "next/server";
import { attachInfosForFixture, getLiveBar, type LiveBarData, type LiveItem } from "@/lib/sources/live-bar";
import { badgeFor, type BadgeSpec } from "@/lib/club-badge";
import { dataLabel, href, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";
import { playerInfoText } from "@/lib/live-bar-i18n";

/**
 * GET /api/live-bar?lang=de|hr
 * Welche Spiele kroatischer Teams/Spieler laufen gerade? (siehe lib/sources/live-bar.ts)
 * Die Datenquellen sind 45 s gecacht, der CDN-Cache der Antwort 30–60 s – viele Leser
 * lösen so nur wenige Funktionsaufrufe pro Minute aus (Free-Plan-schonend).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 25;

export interface LiveBarItemDto {
  id: string;
  kind: LiveItem["kind"];
  competition: string;
  home: string;
  away: string;
  homeBadge: BadgeSpec;
  awayBadge: BadgeSpec;
  homeScore: number;
  awayScore: number;
  minute: string | null;
  halftime: boolean;
  players: string[];
  /** kurze Live-Infos zu den Kroaten, fertig in der Seitensprache (wichtigste zuerst) */
  infos: Array<{ text: string; tone: "good" | "warn" | "info" }>;
  href: string;
}

export interface LiveBarDto {
  items: LiveBarItemDto[];
  next: { text: string; competition: string; home: string; away: string; href: string } | null;
  fetchedAt: string;
  /** Sekunden bis zur nächsten Abfrage */
  pollSec: number;
}

const TARGET: Record<LiveItem["kind"], string> = {
  nt: "/live",
  hnl: "/#hnl",
  europe: "/legionaere",
  league: "/legionaere",
  nba: "/sport",
};

function toDto(d: LiveBarData, lang: Lang): LiveBarDto {
  const badge = (n: string, abbr?: string): BadgeSpec => {
    const b = badgeFor(n);
    return b.known || !abbr ? b : { ...b, abbr: abbr.slice(0, 4).toUpperCase() };
  };
  return {
    items: d.items.map((i) => ({
      id: i.id,
      kind: i.kind,
      competition: dataLabel(i.competition, lang),
      home: dataLabel(i.home, lang),
      away: dataLabel(i.away, lang),
      homeBadge: badge(i.home, i.abbr?.home),
      awayBadge: badge(i.away, i.abbr?.away),
      homeScore: i.homeScore,
      awayScore: i.awayScore,
      minute: i.minute,
      halftime: i.halftime,
      players: i.players.slice(0, 4),
      infos: (i.infos ?? []).map((x) => ({ text: playerInfoText(lang, x), tone: x.tone })),
      href: href(lang, TARGET[i.kind]),
    })),
    next: d.next
      ? {
          text: formatKickoff(d.next.kickoff, lang),
          competition: dataLabel(d.next.competition, lang),
          home: dataLabel(d.next.home, lang),
          away: dataLabel(d.next.away, lang),
          href: href(lang, d.next.kind === "nt" ? "/live" : "/#hnl"),
        }
      : null,
    fetchedAt: d.fetchedAt,
    pollSec: d.items.length ? 60 : 180,
  };
}

export async function GET(req: NextRequest) {
  const lang: Lang = req.nextUrl.searchParams.get("lang") === "hr" ? "hr" : "de";
  let data: LiveBarData;
  // Nur lokal zum Testen der Optik (Umgebungsvariable gibt es auf Vercel nicht).
  const fixture = process.env.LIVE_BAR_FIXTURE_JSON;
  if (fixture) {
    data = { ...(JSON.parse(fixture) as Omit<LiveBarData, "fetchedAt">), fetchedAt: new Date().toISOString() };
    await attachInfosForFixture(data.items);
  } else {
    data = await getLiveBar();
  }
  const dto = toDto(data, lang);
  return NextResponse.json(dto, {
    headers: {
      "Cache-Control": dto.items.length
        ? "public, max-age=0, s-maxage=30, stale-while-revalidate=30"
        : "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
