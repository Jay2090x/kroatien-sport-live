"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchModal } from "@/components/matches/match-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sahovnica } from "@/components/layout/sahovnica";
import { TvChips } from "@/components/matches/tv-chips";
import { teamLogoUrl } from "@/lib/team-logos";
import { formatKickoff, isLiveStatus, scoreDisplay } from "@/lib/utils";
import { useMemo, useState } from "react";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Vatreni: alle kommenden Spiele sichtbar, Logos + TV-Chips, Deduplizierung.
 */
export function NationalTeamSection() {
  const isDe = useLocale() !== "en";
  const { nationalTeamMatches, setSelectedMatch, selectedMatch, refreshLive } =
    useDashboard();
  const [localMatch, setLocalMatch] = useState<Match | null>(null);
  const [showPast, setShowPast] = useState(false);

  const active = localMatch ?? selectedMatch;

  const { allUpcoming, past, liveCount } = useMemo(() => {
    const seen = new Set<string>();
    const unique = nationalTeamMatches.filter((m) => {
      const day = m.kickoff.slice(0, 10);
      const teams = [m.homeTeam, m.awayTeam]
        .map((t) => t.toLowerCase().replace(/[^a-z]/g, ""))
        .sort()
        .join("-");
      const key = `${day}|${teams}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const sorted = [...unique].sort(
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
      allUpcoming: upcoming,
      past: finished,
      liveCount: sorted.filter((m) => isLiveStatus(m.status)).length,
    };
  }, [nationalTeamMatches]);

  function openMatch(m: Match) {
    setLocalMatch(m);
    setSelectedMatch(m);
  }

  return (
    <section id="vatreni" className="scroll-mt-16" aria-labelledby="vatreni-title">
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-3.5 shadow-sm sm:p-4">
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
                  ? "Alle kommenden Länderspiele · Kader erst nach Nominierung"
                  : "All upcoming internationals · squad after nomination"}
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
          <EmptyState
            title={isDe ? "Keine Länderspiele geladen" : "No internationals loaded"}
            description={
              isDe
                ? "API gerade leer oder offline. Bitte kurz neu laden."
                : "API empty or offline. Please refresh."
            }
            actionLabel={isDe ? "Neu laden" : "Refresh"}
            onAction={() => void refreshLive()}
          />
        ) : (
          <div className="space-y-2.5">
            {allUpcoming.length === 0 ? (
              <EmptyState
                title={
                  isDe
                    ? "Kein anstehendes Länderspiel"
                    : "No upcoming international"
                }
                description={
                  isDe
                    ? "Vergangene Spiele kannst du unten einblenden."
                    : "You can expand past matches below."
                }
                className="py-6"
              />
            ) : (
              <ul className="overflow-hidden rounded-xl border border-border/80 divide-y divide-border/80 bg-card/40">
                {allUpcoming.map((m, i) => (
                  <CompactRow
                    key={m.id}
                    match={m}
                    onOpen={() => openMatch(m)}
                    highlight={i < 3}
                  />
                ))}
              </ul>
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
                  <ul className="mt-1.5 overflow-hidden rounded-xl border border-border/60 divide-y divide-border/60 opacity-90">
                    {past.slice(0, 12).map((m) => (
                      <CompactRow
                        key={m.id}
                        match={m}
                        onOpen={() => openMatch(m)}
                        muted
                      />
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
  const homeLogo = teamLogoUrl(m.homeTeam, m.homeTeamLogo);
  const awayLogo = teamLogoUrl(m.awayTeam, m.awayTeamLogo);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          "flex w-full flex-col gap-1.5 px-3 py-2.5 text-left transition-colors hover:bg-secondary/40",
          highlight && "bg-primary/[0.04]",
          muted && "opacity-80"
        )}
      >
        <div className="flex w-full items-center gap-2">
          <time
            dateTime={m.kickoff}
            className="w-[4.25rem] shrink-0 text-[11px] font-semibold tabular-nums text-primary sm:w-24"
          >
            {isLiveStatus(m.status)
              ? "LIVE"
              : formatKickoff(m.kickoff, "d. MMM")}
          </time>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
            <TeamBadge src={homeLogo} name={m.homeTeam} />
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              <span className="truncate">{m.homeTeam}</span>
              <span className="mx-1 font-normal text-muted-foreground">–</span>
              <span className="truncate">{m.awayTeam}</span>
            </p>
            <TeamBadge src={awayLogo} name={m.awayTeam} />
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
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-[4.25rem]">
          <p className="truncate text-[10px] text-muted-foreground">
            {m.leagueName.replace(/ · .*$/, "")}
            {m.venue ? ` · ${m.venue}` : ""}
          </p>
          <TvChips channels={m.tvChannels} max={3} />
        </div>
      </button>
    </li>
  );
}

function TeamBadge({ src, name }: { src: string | null; name: string }) {
  return (
    <span className="relative hidden h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border bg-secondary sm:inline-flex">
      {src ? (
        <Image
          src={src}
          alt=""
          width={24}
          height={24}
          className="h-full w-full object-contain p-0.5"
          unoptimized
        />
      ) : (
        <span className="m-auto text-[9px] font-bold text-muted-foreground">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
