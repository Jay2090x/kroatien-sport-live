"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, CalendarDays, Newspaper, Radio } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  formatKickoff,
  isLiveStatus,
  scoreDisplay,
} from "@/lib/utils";
import {
  localizeCompetitionLabel,
  localizeTeamName,
} from "@/lib/team-names";
import { getDailyNews, newsSlug, tNews } from "@/lib/data/news";
import { useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { TvChips } from "@/components/matches/tv-chips";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

/**
 * „Jetzt“-Hub: Live-Spiele oder nächstes NT / Club-Match + Top-News
 */
export function Hero() {
  const t = useTranslations("Hero");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const { matches, players, nationalTeamMatches, setSelectedMatch } =
    useDashboard();

  const liveMatches = useMemo(
    () =>
      matches
        .filter((m) => isLiveStatus(m.status))
        .sort(
          (a, b) =>
            new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
        )
        .slice(0, 2),
    [matches]
  );

  const nextNt = useMemo(() => {
    return nationalTeamMatches
      .filter(
        (m) =>
          m.status === "scheduled" ||
          m.status === "postponed" ||
          isLiveStatus(m.status)
      )
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      )[0];
  }, [nationalTeamMatches]);

  const nextClub = useMemo(() => {
    return matches
      .filter(
        (m) =>
          m.status === "scheduled" &&
          m.croatianPlayers.length > 0 &&
          !/croatia|kroatien|hrvatska|nations/i.test(m.leagueName + m.homeTeam)
      )
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      )[0];
  }, [matches]);

  const topNews = useMemo(() => {
    const list = getDailyNews(new Date(), { matches, players });
    return list.find((a) => a.featured) ?? list[0] ?? null;
  }, [matches, players]);

  const hasLive = liveMatches.length > 0;

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 sahovnica-bg opacity-25" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-background via-background/96 to-primary/10"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              hasLive
                ? "border-live/40 bg-live/10 text-live"
                : "border-border/80 bg-card/70 text-muted-foreground"
            )}
          >
            <span
              className={cn("live-dot !h-1.5 !w-1.5", !hasLive && "opacity-40")}
              aria-hidden
            />
            {hasLive ? t("badgeLive") : t("badgeNext")}
          </div>
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            {t("subtitle")}
          </p>
        </div>

        <h1 id="hero-title" className="sr-only">
          {t("title")} {t("titleHighlight")}
        </h1>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          {/* Primary: Live or Next */}
          <div className="space-y-2">
            {hasLive ? (
              liveMatches.map((m) => (
                <MatchHighlightCard
                  key={m.id}
                  match={m}
                  locale={locale}
                  liveLabel={tMatch("live")}
                  detailsLabel={t("ctaDetails")}
                  onOpen={() => setSelectedMatch(m)}
                />
              ))
            ) : (
              <>
                {nextNt ? (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="mr-1 inline h-3 w-3 text-primary" />
                      {t("nextNt")}
                    </p>
                    <MatchHighlightCard
                      match={nextNt}
                      locale={locale}
                      liveLabel={tMatch("live")}
                      detailsLabel={t("ctaDetails")}
                      onOpen={() => setSelectedMatch(nextNt)}
                      upcoming
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card/80 px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("noLive")}
                  </div>
                )}
                {nextClub && nextClub.id !== nextNt?.id && (
                  <div>
                    <p className="mb-1.5 mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      {t("nextClub")}
                    </p>
                    <MatchHighlightCard
                      match={nextClub}
                      locale={locale}
                      liveLabel={tMatch("live")}
                      detailsLabel={t("ctaDetails")}
                      onOpen={() => setSelectedMatch(nextClub)}
                      upcoming
                      compact
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Side: Top news + CTAs */}
          <div className="flex flex-col gap-2">
            {topNews && (
              <Link
                href={`/news/${newsSlug(topNews)}`}
                className="group flex flex-1 flex-col rounded-xl border border-border bg-card/80 p-3.5 transition-colors hover:border-primary/40"
              >
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  <Newspaper className="h-3 w-3" />
                  {t("topNews")}
                </span>
                <p className="mt-1.5 text-sm font-bold leading-snug group-hover:text-primary">
                  {tNews(topNews.title, locale)}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                  {tNews(topNews.summary, locale)}
                </p>
                <span className="mt-auto pt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  {t("ctaDetails")}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            )}

            <div className="flex flex-wrap gap-2">
              <a
                href="#vatreni"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {t("ctaNt")}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="#dashboard"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary"
              >
                {t("ctaMatches")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchHighlightCard({
  match,
  locale,
  liveLabel,
  detailsLabel,
  onOpen,
  upcoming,
  compact,
}: {
  match: Match;
  locale: string;
  liveLabel: string;
  detailsLabel: string;
  onOpen: () => void;
  upcoming?: boolean;
  compact?: boolean;
}) {
  const live = isLiveStatus(match.status);
  const home = localizeTeamName(match.homeTeam, locale);
  const away = localizeTeamName(match.awayTeam, locale);
  const league = localizeCompetitionLabel(
    match.leagueName.replace(/ · .*$/, ""),
    locale
  );
  const croats = match.croatianPlayers
    .slice(0, 3)
    .map((p) => p.playerName.split(" ").slice(-1)[0])
    .join(", ");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full rounded-xl border text-left transition-all hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        live
          ? "border-live/40 bg-live/5 ring-1 ring-live/15"
          : "border-border bg-card/90",
        compact ? "p-3" : "p-3.5 sm:p-4"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {live ? (
            <span className="live-badge !text-[10px]">
              <span className="live-dot !h-1.5 !w-1.5" />
              {liveLabel}
              {match.minute != null ? ` ${match.minute}'` : ""}
            </span>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {formatKickoff(match.kickoff, "EEE d. MMM · HH:mm", locale)}
            </Badge>
          )}
          <p
            className={cn(
              "mt-1.5 font-bold leading-snug",
              compact ? "text-sm" : "text-base sm:text-lg"
            )}
          >
            {home}{" "}
            <span className="font-normal text-muted-foreground">–</span> {away}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {league}
            {croats ? ` · ${croats}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {(live || match.status === "finished") && (
            <p
              className={cn(
                "font-bold tabular-nums",
                live ? "text-live text-xl" : "text-lg"
              )}
            >
              {scoreDisplay(match.homeScore, match.awayScore)}
            </p>
          )}
          {upcoming && !live && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
              {detailsLabel}
              <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <TvChips channels={match.tvChannels} max={3} />
          {live && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
              <Radio className="h-3 w-3" />
              {detailsLabel}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
