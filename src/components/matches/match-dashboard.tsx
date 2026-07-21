"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw, Radio, ChevronDown, ChevronUp } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useFavorites } from "@/components/favorites/favorites-context";
import { MatchFilters } from "./match-filters";
import { MatchModal } from "./match-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TvChips } from "@/components/matches/tv-chips";
import {
  cn,
  dateFnsLocale,
  formatKickoff,
  formatTime,
  isLiveStatus,
  scoreDisplay,
  matchesDateFilter,
} from "@/lib/utils";
import {
  localizeCompetitionLabel,
  localizeTeamName,
} from "@/lib/team-names";
import type { Match } from "@/types";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";

const PAST_VISIBLE = 10;
const UPCOMING_VISIBLE = 12;

/**
 * Eine Spiele-Sektion: nächste Termine + Ergebnisse (immer sichtbar).
 */
export function MatchDashboard() {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const dfLocale = dateFnsLocale(locale);
  const {
    filteredMatches,
    clubMatches,
    filters,
    selectedMatch,
    setSelectedMatch,
    lastUpdated,
    dataSource,
    dataErrors,
    refreshLive,
    isRefreshing,
  } = useDashboard();
  const { favoritesOnly, favoriteIds } = useFavorites();
  const tFav = useTranslations("Favorites");

  const [showMoreUpcoming, setShowMoreUpcoming] = useState(false);
  const [showOlder, setShowOlder] = useState(false);

  /**
   * Live/Upcoming: mit Datumsfilter
   * Ergebnisse: immer (Datumsfilter greift hier nicht – sonst „keine Ergebnisse“)
   * Liga/Suche/Spieler-Filter gelten überall
   */
  const { live, upcoming, pastRecent, pastOlder } = useMemo(() => {
    const favSet = new Set(favoriteIds);
    const byMeta = (m: Match) => {
      if (filters.league === "live") {
        return m.status === "live" || m.status === "halftime";
      }
      if (filters.league !== "all" && m.league !== filters.league) return false;
      if (filters.playerId) {
        if (!m.croatianPlayers.some((p) => p.playerId === filters.playerId))
          return false;
      }
      if (favoritesOnly && favSet.size > 0) {
        if (!m.croatianPlayers.some((p) => favSet.has(p.playerId))) return false;
      } else if (favoritesOnly && favSet.size === 0) {
        return false;
      }
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase().trim();
        const hit =
          m.homeTeam.toLowerCase().includes(q) ||
          m.awayTeam.toLowerCase().includes(q) ||
          m.leagueName.toLowerCase().includes(q) ||
          m.croatianPlayers.some((p) =>
            p.playerName.toLowerCase().includes(q)
          ) ||
          (m.venue?.toLowerCase().includes(q) ?? false);
        if (!hit) return false;
      }
      return true;
    };

    const pool = clubMatches.filter(byMeta);
    const liveList = pool
      .filter((m) => isLiveStatus(m.status))
      .filter((m) => matchesDateFilter(m.kickoff, filters.date))
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );

    const upcomingList = pool
      .filter((m) => m.status === "scheduled" || m.status === "postponed")
      .filter((m) => matchesDateFilter(m.kickoff, filters.date))
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );

    // Ergebnisse: immer (neueste zuerst), unabhängig vom Datums-Chip
    const pastList = pool
      .filter((m) => m.status === "finished" || m.status === "cancelled")
      .sort(
        (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
      );

    return {
      live: liveList,
      upcoming: upcomingList,
      pastRecent: pastList.slice(0, PAST_VISIBLE),
      pastOlder: pastList.slice(PAST_VISIBLE),
    };
  }, [clubMatches, filters, favoritesOnly, favoriteIds]);

  const upcomingShown = showMoreUpcoming
    ? upcoming
    : upcoming.slice(0, UPCOMING_VISIBLE);
  const upcomingHidden = Math.max(0, upcoming.length - UPCOMING_VISIBLE);

  const liveCount = clubMatches.filter((m) => isLiveStatus(m.status)).length;
  const resultsCount = pastRecent.length + pastOlder.length;

  const empty =
    live.length === 0 && upcoming.length === 0 && pastRecent.length === 0;

  return (
    <section
      id="dashboard"
      className="scroll-mt-14"
      aria-labelledby="dashboard-title"
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-live/30 bg-live/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-live">
            <Radio className="h-3 w-3" aria-hidden />
            {t("liveNow")}
            {liveCount > 0 && ` · ${liveCount}`}
          </div>
          <h2
            id="dashboard-title"
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {t("lastUpdated")}{" "}
            {formatKickoff(lastUpdated, "HH:mm:ss", locale)}
            {" · "}
            {t("source")}: {dataSource}
            {favoritesOnly ? ` · ${tFav("filterShort")}` : ""}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            onClick={() => void refreshLive()}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
          >
            <RefreshCw
              className={cn("h-3 w-3", isRefreshing && "animate-spin")}
            />
            {isRefreshing ? "…" : t("refresh")}
          </Button>
        </div>
      </div>

      {dataErrors && dataErrors.length > 0 && (
        <p className="mb-2 truncate rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-100/80">
          API: {dataErrors[0]}
        </p>
      )}

      <MatchFilters />

      {empty ? (
        <EmptyState
          className="mt-3"
          title={favoritesOnly ? tFav("emptyMatches") : t("empty")}
          description={
            favoritesOnly ? tFav("emptyMatchesHint") : t("emptyHint")
          }
          actionLabel={favoritesOnly ? tFav("filterOnly") : t("reload")}
          onAction={() => {
            if (favoritesOnly) {
              /* keep reload for data; favorites empty is UX */
              void refreshLive();
            } else {
              void refreshLive();
            }
          }}
        />
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
          {live.length > 0 && (
            <MatchGroup
              label={t("liveNow")}
              accent="live"
            >
              {live.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onOpen={() => setSelectedMatch(m)}
                  locale={locale}
                  liveLabel={tMatch("live")}
                  dayHint={dayHint(
                    m.kickoff,
                    tCommon("today"),
                    tCommon("tomorrow"),
                    dfLocale
                  )}
                />
              ))}
            </MatchGroup>
          )}

          {upcoming.length > 0 && (
            <MatchGroup
              label={t("nextFixtures")}
              count={upcoming.length}
            >
              {upcomingShown.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onOpen={() => setSelectedMatch(m)}
                  locale={locale}
                  liveLabel={tMatch("live")}
                  dayHint={dayHint(
                    m.kickoff,
                    tCommon("today"),
                    tCommon("tomorrow"),
                    dfLocale
                  )}
                />
              ))}
              {upcomingHidden > 0 && (
                <li className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowMoreUpcoming((v) => !v)}
                    className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-primary hover:bg-secondary/50"
                  >
                    {showMoreUpcoming ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        {t("showLess")}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        {t("showMore", { count: upcomingHidden })}
                      </>
                    )}
                  </button>
                </li>
              )}
            </MatchGroup>
          )}

          {/* Ergebnisse – immer rendern wenn vorhanden */}
          <MatchGroup
            label={t("results")}
            count={resultsCount}
            mutedHeader
          >
            {pastRecent.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                {t("noFinished")}
              </li>
            ) : (
              <>
                {pastRecent.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    onOpen={() => setSelectedMatch(m)}
                    locale={locale}
                    liveLabel={tMatch("live")}
                    dayHint={dayHint(
                      m.kickoff,
                      tCommon("today"),
                      tCommon("tomorrow"),
                      dfLocale
                    )}
                  />
                ))}
                {pastOlder.length > 0 && (
                  <>
                    {showOlder &&
                      pastOlder.map((m) => (
                        <MatchRow
                          key={m.id}
                          match={m}
                          onOpen={() => setSelectedMatch(m)}
                          locale={locale}
                          liveLabel={tMatch("live")}
                          dayHint={dayHint(
                            m.kickoff,
                            tCommon("today"),
                            tCommon("tomorrow"),
                            dfLocale
                          )}
                          muted
                        />
                      ))}
                    <li className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => setShowOlder((v) => !v)}
                        className="flex w-full items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      >
                        {showOlder ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5" />
                            {t("showLess")}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            {t("olderResults", { count: pastOlder.length })}
                          </>
                        )}
                      </button>
                    </li>
                  </>
                )}
              </>
            )}
          </MatchGroup>
        </div>
      )}

      <MatchModal
        match={selectedMatch}
        open={!!selectedMatch}
        onOpenChange={(open) => {
          if (!open) setSelectedMatch(null);
        }}
      />
    </section>
  );
}

function MatchGroup({
  label,
  count,
  children,
  accent,
  mutedHeader,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
  accent?: "live";
  mutedHeader?: boolean;
}) {
  return (
    <div className="border-b border-border last:border-b-0">
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide",
          accent === "live"
            ? "bg-live/15 text-live"
            : mutedHeader
              ? "bg-muted/80 text-muted-foreground"
              : "bg-secondary text-secondary-foreground"
        )}
      >
        {accent === "live" && (
          <span className="live-dot !h-1.5 !w-1.5" aria-hidden />
        )}
        {label}
        {count != null && (
          <span className="font-normal normal-case opacity-70">({count})</span>
        )}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function MatchRow({
  match: m,
  onOpen,
  dayHint,
  muted,
  locale,
  liveLabel,
}: {
  match: Match;
  onOpen: () => void;
  dayHint?: string;
  muted?: boolean;
  locale: string;
  liveLabel: string;
}) {
  const croats = m.croatianPlayers
    .slice(0, 3)
    .map((p) => p.playerName.split(" ").slice(-1)[0])
    .join(", ");
  const extra = m.croatianPlayers.length - 3;
  const live = isLiveStatus(m.status);
  const home = localizeTeamName(m.homeTeam, locale);
  const away = localizeTeamName(m.awayTeam, locale);
  const league = localizeCompetitionLabel(
    m.leagueName.replace(/ · .*$/, ""),
    locale
  );

  return (
    <li
      className={cn(
        "border-b border-border last:border-b-0",
        muted && "opacity-80"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/60"
      >
        <div className="w-[4.25rem] shrink-0 sm:w-20">
          {live ? (
            <span className="live-badge !text-[9px]">{liveLabel}</span>
          ) : (
            <>
              <time
                dateTime={m.kickoff}
                className="block text-[11px] font-bold tabular-nums text-primary"
              >
                {m.status === "finished"
                  ? formatKickoff(m.kickoff, "d. MMM", locale)
                  : formatTime(m.kickoff, locale)}
              </time>
              {dayHint && m.status !== "finished" && (
                <span className="text-[9px] text-muted-foreground">{dayHint}</span>
              )}
              {m.status === "finished" && (
                <span className="text-[9px] text-muted-foreground">
                  {formatTime(m.kickoff, locale)}
                </span>
              )}
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {home}{" "}
            <span className="font-normal text-muted-foreground">–</span>{" "}
            {away}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {league}
            {croats ? ` · ${croats}${extra > 0 ? ` +${extra}` : ""}` : ""}
          </p>
          <TvChips channels={m.tvChannels} max={2} className="mt-1" />
        </div>

        <div className="shrink-0 text-right">
          {m.status === "finished" || live ? (
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                live && "text-live"
              )}
            >
              {scoreDisplay(m.homeScore, m.awayScore)}
            </span>
          ) : (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {formatKickoff(m.kickoff, "EEE", locale)}
            </Badge>
          )}
        </div>
      </button>
    </li>
  );
}

function dayHint(
  iso: string,
  today: string,
  tomorrow: string,
  locale: DateFnsLocale
): string | undefined {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return today;
    if (isTomorrow(d)) return tomorrow;
    return format(d, "EEE d.M.", { locale });
  } catch {
    return undefined;
  }
}
