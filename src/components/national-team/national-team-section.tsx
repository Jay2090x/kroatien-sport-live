"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Flag } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchModal } from "@/components/matches/match-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Sahovnica } from "@/components/layout/sahovnica";
import { TvChips } from "@/components/matches/tv-chips";
import { teamLogoUrl } from "@/lib/team-logos";
import {
  localizeCompetitionLabel,
  localizeTeamName,
} from "@/lib/team-names";
import { formatKickoff, isLiveStatus, scoreDisplay } from "@/lib/utils";
import { useMemo, useState } from "react";
import type { Match } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Vatreni: alle kommenden Spiele sichtbar, Logos + TV-Chips, Deduplizierung.
 */
export function NationalTeamSection() {
  const t = useTranslations("Vatreni");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
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
                {t("title")}
                {liveCount > 0 && (
                  <span className="live-badge ml-1 !text-[9px]">
                    {tMatch("live")}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 text-[10px]">
            <Badge variant="secondary" className="px-1.5 py-0">
              {allUpcoming.length} {t("upcoming")}
            </Badge>
            <Badge variant="outline" className="px-1.5 py-0">
              {past.length} {t("past")}
            </Badge>
          </div>
        </div>

        {allUpcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyHint")}
            actionLabel={t("reload")}
            onAction={() => void refreshLive()}
          />
        ) : (
          <div className="space-y-2.5">
            {allUpcoming.length === 0 ? (
              <EmptyState
                title={t("emptyUpcoming")}
                description={t("emptyUpcomingHint")}
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
                    locale={locale}
                    liveLabel={tMatch("live")}
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
                  {t("pastToggle", { count: past.length })}
                </Button>
                {showPast && (
                  <ul className="mt-1.5 overflow-hidden rounded-xl border border-border/60 divide-y divide-border/60 opacity-90">
                    {past.slice(0, 12).map((m) => (
                      <CompactRow
                        key={m.id}
                        match={m}
                        onOpen={() => openMatch(m)}
                        muted
                        locale={locale}
                        liveLabel={tMatch("live")}
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
  locale,
  liveLabel,
}: {
  match: Match;
  onOpen: () => void;
  highlight?: boolean;
  muted?: boolean;
  locale: string;
  liveLabel: string;
}) {
  const homeName = localizeTeamName(m.homeTeam, locale);
  const awayName = localizeTeamName(m.awayTeam, locale);
  const homeLogo = teamLogoUrl(m.homeTeam, m.homeTeamLogo);
  const awayLogo = teamLogoUrl(m.awayTeam, m.awayTeamLogo);
  const live = isLiveStatus(m.status);
  const comp = localizeCompetitionLabel(
    m.leagueName.replace(/ · .*$/, ""),
    locale
  );

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
        {/* Zeile 1: Datum+Uhrzeit | Flagge Team – Team Flagge | Score/Status */}
        <div className="flex w-full items-center gap-2">
          <div className="w-[4.75rem] shrink-0 sm:w-[5.5rem]">
            {live ? (
              <span className="live-badge !text-[9px]">{liveLabel}</span>
            ) : (
              <>
                <time
                  dateTime={m.kickoff}
                  className="block text-[11px] font-semibold tabular-nums leading-tight text-primary"
                >
                  {formatKickoff(m.kickoff, "d. MMM", locale)}
                </time>
                <span className="text-[11px] font-bold tabular-nums text-foreground/90">
                  {m.status === "finished"
                    ? scoreDisplay(m.homeScore, m.awayScore)
                    : formatKickoff(m.kickoff, "HH:mm", locale)}
                </span>
              </>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <TeamBadge src={homeLogo} name={homeName} />
            <p className="min-w-0 truncate text-sm font-medium leading-snug">
              {homeName}
              <span className="mx-1 font-normal text-muted-foreground">–</span>
              {awayName}
            </p>
            <TeamBadge src={awayLogo} name={awayName} />
          </div>

          {live && (
            <span className="shrink-0 text-sm font-bold tabular-nums text-live">
              {scoreDisplay(m.homeScore, m.awayScore)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-[5.5rem]">
          <p className="truncate text-[10px] text-muted-foreground">
            {comp}
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
    <span className="relative inline-flex h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
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
