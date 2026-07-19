"use client";

import { useLocale } from "next-intl";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchModal } from "@/components/matches/match-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sahovnica } from "@/components/layout/sahovnica";
import { formatKickoff, isLiveStatus, scoreDisplay } from "@/lib/utils";
import { useMemo, useState } from "react";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

const NEXT_COUNT = 3;

/**
 * Kompakte Vatreni-Rubrik: nächste 3 Termine, Rest aufklappbar.
 * Keine Spekulations-Kader.
 */
export function NationalTeamSection() {
  const isDe = useLocale() !== "en";
  const { nationalTeamMatches, setSelectedMatch, selectedMatch } =
    useDashboard();
  const [localMatch, setLocalMatch] = useState<Match | null>(null);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const active = localMatch ?? selectedMatch;

  const { nextThree, allUpcoming, past, liveCount } = useMemo(() => {
    const sorted = [...nationalTeamMatches].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    const upcoming = sorted.filter(
      (m) =>
        m.status === "scheduled" ||
        m.status === "live" ||
        m.status === "halftime" ||
        m.status === "postponed"
    );
    const finished = sorted
      .filter((m) => m.status === "finished" || m.status === "cancelled")
      .sort(
        (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
      );
    return {
      nextThree: upcoming.slice(0, NEXT_COUNT),
      allUpcoming: upcoming,
      past: finished,
      liveCount: sorted.filter((m) => isLiveStatus(m.status)).length,
    };
  }, [nationalTeamMatches]);

  function openMatch(m: Match) {
    setLocalMatch(m);
    setSelectedMatch(m);
  }

  const moreUpcoming = Math.max(0, allUpcoming.length - NEXT_COUNT);

  return (
    <section id="vatreni" className="scroll-mt-16" aria-labelledby="vatreni-title">
      <div className="rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-3.5 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Sahovnica size="sm" />
            <div>
              <h2
                id="vatreni-title"
                className="flex items-center gap-1.5 text-base font-bold tracking-tight sm:text-lg"
              >
                <Flag className="h-4 w-4 text-primary" aria-hidden />
                {isDe ? "Nationalmannschaft" : "National team"}
                {liveCount > 0 && (
                  <span className="live-badge ml-1 !text-[9px]">LIVE</span>
                )}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {isDe
                  ? "Kommende Länderspiele · Kader erst nach Nominierung"
                  : "Upcoming internationals · squad after nomination"}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 text-[10px]">
            <Badge variant="secondary" className="px-1.5 py-0">
              {allUpcoming.length} {isDe ? "kommend" : "up"}
            </Badge>
            <Badge variant="outline" className="px-1.5 py-0">
              {past.length} {isDe ? "vergangen" : "past"}
            </Badge>
          </div>
        </div>

        {allUpcoming.length === 0 && past.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {isDe ? "Keine Länderspiele geladen." : "No internationals loaded."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {allUpcoming.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                {isDe
                  ? "Kein anstehendes Länderspiel – vergangene unten."
                  : "No upcoming international – past below."}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {nextThree.map((m) => (
                  <CompactRow key={m.id} match={m} onOpen={() => openMatch(m)} highlight />
                ))}
              </ul>
            )}

            {allUpcoming.length > NEXT_COUNT && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-full text-xs sm:w-auto"
                  onClick={() => setShowAllUpcoming((v) => !v)}
                  aria-expanded={showAllUpcoming}
                >
                  {showAllUpcoming ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {showAllUpcoming
                    ? isDe
                      ? "Einklappen"
                      : "Collapse"
                    : isDe
                      ? `Alle ${allUpcoming.length} kommenden (+${moreUpcoming})`
                      : `All ${allUpcoming.length} upcoming (+${moreUpcoming})`}
                </Button>
                {showAllUpcoming && (
                  <ul className="mt-2 overflow-hidden rounded-lg border border-border divide-y divide-border">
                    {allUpcoming.slice(NEXT_COUNT).map((m) => (
                      <CompactRow key={m.id} match={m} onOpen={() => openMatch(m)} />
                    ))}
                  </ul>
                )}
              </div>
            )}

            {past.length > 0 && (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-full text-xs text-muted-foreground sm:w-auto"
                  onClick={() => setShowPast((v) => !v)}
                >
                  {showPast ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                  {isDe
                    ? `Vergangene (${past.length})`
                    : `Past (${past.length})`}
                </Button>
                {showPast && (
                  <ul className="mt-1.5 overflow-hidden rounded-lg border border-border/70 divide-y divide-border opacity-90">
                    {past.slice(0, 12).map((m) => (
                      <CompactRow key={m.id} match={m} onOpen={() => openMatch(m)} muted />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <MatchModal
        match={active}
        open={!!localMatch}
        onOpenChange={(open) => {
          if (!open) {
            setLocalMatch(null);
            setSelectedMatch(null);
          }
        }}
      />
    </section>
  );
}

function CompactRow({
  match: m,
  onOpen,
  highlight,
  muted,
}: {
  match: Match;
  onOpen: () => void;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50",
          highlight && "bg-primary/[0.04]",
          muted && "opacity-80"
        )}
      >
        <time
          dateTime={m.kickoff}
          className="w-[4.5rem] shrink-0 text-[11px] font-semibold tabular-nums text-primary sm:w-24"
        >
          {isLiveStatus(m.status)
            ? "LIVE"
            : formatKickoff(m.kickoff, "d. MMM")}
        </time>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {m.homeTeam}{" "}
            <span className="text-muted-foreground font-normal">–</span>{" "}
            {m.awayTeam}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {m.leagueName.replace(/ · .*$/, "")}
            {m.venue ? ` · ${m.venue}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {isLiveStatus(m.status) ? (
            <span className="live-badge !text-[9px]">LIVE</span>
          ) : m.status === "finished" ? (
            <span className="text-sm font-bold tabular-nums">
              {scoreDisplay(m.homeScore, m.awayScore)}
            </span>
          ) : (
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {formatKickoff(m.kickoff, "HH:mm")}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
