import { NextResponse, type NextRequest } from "next/server";
import { attachInfosForFixture, getLiveBar, type LiveBarData, type LiveItem } from "@/lib/sources/live-bar";
import { badgeFor, type BadgeSpec } from "@/lib/club-badge";
import { dataLabel, href, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";
import { playerInfoText } from "@/lib/live-bar-i18n";
import { gamePath } from "@/lib/sources/game";

/**
 * GET /api/live-bar?lang=de|hr
 * Welche Spiele kroatischer Teams/Spieler laufen gerade? (siehe lib/sources/live-bar.ts)
 * Läuft etwas: Quellen 15 s im Speicher, CDN 15 s (+5 s SWR), Browser fragt alle 20 s.
 * Leerlauf: CDN 60 s (+60 s SWR), Browser alle 3 min – Free-Plan-schonend.
 * fetchedAt = echter Abrufzeitpunkt der ältesten Live-Quelle, serverTime = Erzeugung der Antwort.
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
  clockRunning: boolean;
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
  serverTime: string;
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

/** Jedes laufende Spiel bekommt seine Spielseite; Vatreni behalten den ausführlichen Live-Ticker. */
function itemPath(i: LiveItem): string {
  if (i.kind === "hnl") {
    const id = i.id.replace(/^hnl-/, "");
    return /^\d+$/.test(id) ? gamePath("hnl", id) : TARGET.hnl;
  }
  if (i.kind !== "nt" && i.ref) return gamePath(i.ref.slug, i.ref.eventId);
  return TARGET[i.kind];
}

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
      clockRunning: !!i.clockRunning,
      halftime: i.halftime,
      players: i.players.slice(0, 4),
      infos: (i.infos ?? []).map((x) => ({ text: playerInfoText(lang, x), tone: x.tone })),
      href: href(lang, itemPath(i)),
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
    serverTime: new Date().toISOString(),
    pollSec: d.items.length ? 20 : 180,
  };
}

export async function GET(req: NextRequest) {
  const lang: Lang = req.nextUrl.searchParams.get("lang") === "hr" ? "hr" : "de";
  let data: LiveBarData;
  // Nur lokal zum Testen der Optik (Umgebungsvariable gibt es auf Vercel nicht).
  const fixture = process.env.LIVE_BAR_FIXTURE_JSON;
  if (fixture) {
    // Datei-Pfad erlaubt sich ändernde Fixtures während des Tests
    const raw = fixture.trim().startsWith("{") ? fixture : (await import("node:fs")).readFileSync(fixture, "utf8");
    data = { ...(JSON.parse(raw) as Omit<LiveBarData, "fetchedAt">), fetchedAt: new Date().toISOString() };
    await attachInfosForFixture(data.items);
  } else {
    data = await getLiveBar();
  }
  const dto = toDto(data, lang);
  return NextResponse.json(dto, {
    headers: {
      "Cache-Control": dto.items.length
        ? "public, max-age=0, s-maxage=15, stale-while-revalidate=5"
        : "public, max-age=0, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
