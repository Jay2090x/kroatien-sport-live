"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RefreshCw, Radio, ChevronDown, ChevronUp } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchFilters } from "./match-filters";
import { MatchModal } from "./match-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatKickoff,
  formatTime,
  isLiveStatus,
  scoreDisplay,
  matchesDateFilter,
} from "@/lib/utils";
import type { Match } from "@/types";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { de } from "date-fns/locale";

const PAST_VISIBLE = 10;
const UPCOMING_VISIBLE = 12;

/**
 * Eine Spiele-Sektion: nächste Termine + Ergebnisse (immer sichtbar).
 */
export function MatchDashboard() {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const isDe = locale === "de";
  const isHr = locale === "hr";

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

  const [showMoreUpcoming, setShowMoreUpcoming] = useState(false);
  const [showOlder, setShowOlder] = useState(false);

  /**
   * Live/Upcoming: mit Datumsfilter
   * Ergebnisse: immer (Datumsfilter greift hier nicht – sonst „keine Ergebnisse“)
   * Liga/Suche/Spieler-Filter gelten überall
   */
  const { live, upcoming, pastRecent, pastOlder } = useMemo(() => {
    const byMeta = (m: Match) => {
      if (filters.league === "live") {
        return m.status === "live" || m.status === "halftime";
      }
      if (filters.league !== "all" && m.league !== filters.league) return false;
      if (filters.playerId) {
        if (!m.croatianPlayers.some((p) => p.playerId === filters.playerId))
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
  }, [clubMatches, filters]);

  const upcomingShown = showMoreUpcoming
    ? upcoming
    : upcoming.slice(0, UPCOMING_VISIBLE);
  const upcomingHidden = Math.max(0, upcoming.length - UPCOMING_VISIBLE);

  const liveCount = clubMatches.filter((m) => isLiveStatus(m.status)).length;
  const resultsCount = pastRecent.length + pastOlder.length;

  const title = isHr ? "Utakmice" : isDe ? "Spiele" : "Matches";
  const subtitle = isHr
    ? "Klubovi s hrvatskim igračima"
    : isDe
      ? "Clubs mit kroatischen Spielern"
      : "Clubs with Croatian players";

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
            Live
            {liveCount > 0 && ` · ${liveCount}`}
          </div>
          <h2
            id="dashboard-title"
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {formatKickoff(lastUpdated, "HH:mm:ss")} · {dataSource} ·{" "}
            {filteredMatches.length}
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
            {isRefreshing ? "…" : "Refresh"}
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
        <div
          className="mt-3 rounded-lg border border-border px-4 py-8 text-center"
          role="status"
        >
          <p className="text-sm font-medium">{t("empty")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("emptyHint")}</p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
          {live.length > 0 && (
            <MatchGroup
              label={isHr ? "Uživo" : isDe ? "Jetzt live" : "Live now"}
              accent="live"
            >
              {live.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onOpen={() => setSelectedMatch(m)}
                  dayHint={dayHint(
                    m.kickoff,
                    tCommon("today"),
                    tCommon("tomorrow")
                  )}
                />
              ))}
            </MatchGroup>
          )}

          {upcoming.length > 0 && (
            <MatchGroup
              label={
                isHr ? "Idući termini" : isDe ? "Nächste Termine" : "Next fixtures"
              }
              count={upcoming.length}
            >
              {upcomingShown.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onOpen={() => setSelectedMatch(m)}
                  dayHint={dayHint(
                    m.kickoff,
                    tCommon("today"),
                    tCommon("tomorrow")
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
                        {isHr ? "Manje" : isDe ? "Weniger" : "Show less"}
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        {isHr
                          ? `Još ${upcomingHidden}`
                          : isDe
                            ? `${upcomingHidden} weitere`
                            : `${upcomingHidden} more`}
                      </>
                    )}
                  </button>
                </li>
              )}
            </MatchGroup>
          )}

          {/* Ergebnisse – immer rendern wenn vorhanden */}
          <MatchGroup
            label={isHr ? "Rezultati" : isDe ? "Ergebnisse" : "Results"}
            count={resultsCount}
            mutedHeader
          >
            {pastRecent.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                {isHr
                  ? "Nema završenih utakmica za ovaj filter."
                  : isDe
                    ? "Keine beendeten Spiele für diesen Filter."
                    : "No finished matches for this filter."}
              </li>
            ) : (
              <>
                {pastRecent.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    onOpen={() => setSelectedMatch(m)}
                    dayHint={dayHint(
                      m.kickoff,
                      tCommon("today"),
                      tCommon("tomorrow")
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
                          dayHint={dayHint(
                            m.kickoff,
                            tCommon("today"),
                            tCommon("tomorrow")
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
                            {isHr
                              ? "Sakrij starije"
                              : isDe
                                ? "Ältere einklappen"
                                : "Hide older"}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5" />
                            {isHr
                              ? `Stariji rezultati (${pastOlder.length})`
                              : isDe
                                ? `Ältere Ergebnisse (${pastOlder.length})`
                                : `Older results (${pastOlder.length})`}
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
}: {
  match: Match;
  onOpen: () => void;
  dayHint?: string;
  muted?: boolean;
}) {
  const croats = m.croatianPlayers
    .slice(0, 3)
    .map((p) => p.playerName.split(" ").slice(-1)[0])
    .join(", ");
  const extra = m.croatianPlayers.length - 3;
  const live = isLiveStatus(m.status);

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
            <span className="live-badge !text-[9px]">LIVE</span>
          ) : (
            <>
              <time
                dateTime={m.kickoff}
                className="block text-[11px] font-bold tabular-nums text-primary"
              >
                {m.status === "finished"
                  ? formatKickoff(m.kickoff, "d. MMM")
                  : formatTime(m.kickoff)}
              </time>
              {dayHint && m.status !== "finished" && (
                <span className="text-[9px] text-muted-foreground">{dayHint}</span>
              )}
              {m.status === "finished" && (
                <span className="text-[9px] text-muted-foreground">
                  {formatTime(m.kickoff)}
                </span>
              )}
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {m.homeTeam}{" "}
            <span className="font-normal text-muted-foreground">–</span>{" "}
            {m.awayTeam}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {m.leagueName.replace(/ · .*$/, "")}
            {croats ? ` · ${croats}${extra > 0 ? ` +${extra}` : ""}` : ""}
          </p>
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
              {formatKickoff(m.kickoff, "EEE")}
            </Badge>
          )}
        </div>
      </button>
    </li>
  );
}

function dayHint(iso: string, today: string, tomorrow: string): string | undefined {
  try {
    const d = parseISO(iso);
    if (isToday(d)) return today;
    if (isTomorrow(d)) return tomorrow;
    return format(d, "EEE d.M.", { locale: de });
  } catch {
    return undefined;
  }
}
