"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Sparkles,
  Star,
  Newspaper,
  ExternalLink,
  Radio,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useFavorites } from "@/components/favorites/favorites-context";
import { Link } from "@/i18n/navigation";
import { formatKickoff, isLiveStatus, scoreDisplay } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { cleanNewsText } from "@/lib/data/news-images";
import { tNews, type NewsArticle } from "@/lib/data/news";
import type { Match } from "@/types";

const MS_48H = 48 * 60 * 60 * 1000;

/**
 * „Heute für dich“: Favoriten 48h + Top-Headline + Quick-CTAs
 */
export function TodayForYou({
  topHeadline,
}: {
  topHeadline?: NewsArticle | null;
}) {
  const t = useTranslations("Today");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const { matches } = useDashboard();
  const { favoriteIds } = useFavorites();

  const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((m) => {
        const tMs = new Date(m.kickoff).getTime();
        if (Number.isNaN(tMs)) return false;
        if (m.status === "cancelled" || m.status === "finished") return false;
        if (tMs < now - 2 * 3600_000) return false;
        if (tMs - now > MS_48H) return false;
        if (favSet.size === 0) return m.croatianPlayers.length > 0;
        return m.croatianPlayers.some((p) => favSet.has(p.playerId));
      })
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      )
      .slice(0, 4);
  }, [matches, favSet]);

  const headline = topHeadline;
  const hasFavs = favoriteIds.length > 0;
  const externalHeadline = Boolean(
    headline?.isExternal || headline?.id.startsWith("auto-")
  );

  return (
    <section
      id="today"
      className="scroll-mt-16 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-card to-card p-3.5 shadow-sm sm:p-5"
      aria-labelledby="today-title"
    >
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="today-title"
            className="flex items-center gap-1.5 text-lg font-bold tracking-tight sm:text-xl"
          >
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            {t("title")}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hasFavs ? t("subtitleFavs") : t("subtitleDefault")}
          </p>
        </div>
        {!hasFavs && (
          <a
            href="#players"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Star className="h-3.5 w-3.5" />
            {t("addFavs")}
          </a>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Matches 48h */}
        <div className="rounded-xl border border-border/80 bg-card/70 p-3 lg:col-span-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("next48")}
          </p>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noMatches")}</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <MatchLine
                    match={m}
                    locale={locale}
                    liveLabel={tMatch("live")}
                    favSet={favSet}
                  />
                </li>
              ))}
            </ul>
          )}
          <a
            href="#live-board"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <Radio className="h-3.5 w-3.5" />
            {t("openBoard")}
          </a>
        </div>

        {/* Top headline */}
        <div className="rounded-xl border border-border/80 bg-card/70 p-3 lg:col-span-1">
          <p className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <Newspaper className="h-3.5 w-3.5" />
            {t("topStory")}
          </p>
          {headline ? (
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {cleanNewsText(tNews(headline.tag, locale), 48)}
              </p>
              <p className="mt-1 text-sm font-bold leading-snug">
                {cleanNewsText(tNews(headline.title, locale), 140)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {cleanNewsText(tNews(headline.summary, locale), 160)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {externalHeadline && headline.sourceUrl ? (
                  <a
                    href={headline.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {t("openOriginal")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Link
                    href={`/news/${headline.id}`}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {t("readMore")} →
                  </Link>
                )}
                <a
                  href="#news"
                  className="text-xs font-semibold text-muted-foreground hover:text-primary"
                >
                  {t("allNews")}
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noStory")}</p>
          )}
        </div>

        {/* Quick CTAs */}
        <div className="rounded-xl border border-border/80 bg-card/70 p-3 lg:col-span-1">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("quickTitle")}
          </p>
          <ul className="space-y-1.5">
            <li>
              <a
                href="#live-board"
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <Radio className="h-4 w-4 text-live" />
                {t("ctaBoard")}
              </a>
            </li>
            <li>
              <a
                href="#favorites"
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <Star className="h-4 w-4 text-amber-400" />
                {t("ctaWeek")}
              </a>
            </li>
            <li>
              <a
                href="#players"
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <Users className="h-4 w-4 text-primary" />
                {t("ctaPlayers")}
              </a>
            </li>
            <li>
              <a
                href="#news"
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-secondary/40"
              >
                <Newspaper className="h-4 w-4 text-primary" />
                {t("ctaNews")}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function MatchLine({
  match: m,
  locale,
  liveLabel,
  favSet,
}: {
  match: Match;
  locale: string;
  liveLabel: string;
  favSet: Set<string>;
}) {
  const live = isLiveStatus(m.status);
  const croats = m.croatianPlayers
    .filter((p) => favSet.size === 0 || favSet.has(p.playerId))
    .map((p) => p.playerName)
    .slice(0, 3)
    .join(", ");

  return (
    <Link
      href={`/match/${m.id}`}
      className="block rounded-lg border border-border/60 px-2.5 py-2 transition-colors hover:border-primary/40 hover:bg-secondary/40"
    >
      <div className="flex items-center justify-between gap-2">
        {live ? (
          <span className="live-badge !text-[9px]">{liveLabel}</span>
        ) : (
          <time
            dateTime={m.kickoff}
            className="text-[11px] font-semibold tabular-nums text-primary"
          >
            {formatKickoff(m.kickoff, "EEE HH:mm", locale)}
          </time>
        )}
        {live && (
          <span className="text-sm font-bold tabular-nums text-live">
            {scoreDisplay(m.homeScore, m.awayScore)}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-sm font-semibold">
        {localizeTeamName(m.homeTeam, locale)} –{" "}
        {localizeTeamName(m.awayTeam, locale)}
      </p>
      {croats && (
        <p className="truncate text-[10px] text-muted-foreground">{croats}</p>
      )}
    </Link>
  );
}
