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
import { Link } from "@/i18n/navigation";

/**
 * Alle bekannten Länderspiele – kompakt, klickbar.
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

  const { upcoming, past, liveCount } = useMemo(() => {
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
    const up = sorted.filter(
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
      upcoming: up,
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
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-3 shadow-sm sm:p-3.5">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
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
                {t("subtitleAll")}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {upcoming.length} {t("upcoming")}
          </Badge>
        </div>

        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            title={t("empty")}
            description={t("emptyHint")}
            actionLabel={t("reload")}
            onAction={() => void refreshLive()}
          />
        ) : (
          <div className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                {t("emptyUpcoming")}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-lg border border-border/80 divide-y divide-border/70 bg-card/40">
                {upcoming.map((m) => (
                  <CompactRow
                    key={m.id}
                    match={m}
                    onOpen={() => openMatch(m)}
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
                  <ul className="mt-1 overflow-hidden rounded-lg border border-border/60 divide-y divide-border/60 opacity-90">
                    {past.map((m) => (
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
  muted,
  locale,
  liveLabel,
}: {
  match: Match;
  onOpen: () => void;
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
      <div
        className={cn(
          "flex w-full items-center gap-2 px-2.5 py-2 transition-colors hover:bg-secondary/40",
          muted && "opacity-80"
        )}
      >
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <div className="w-[4.25rem] shrink-0 sm:w-[5rem]">
            {live ? (
              <span className="live-badge !text-[9px]">{liveLabel}</span>
            ) : (
              <>
                <time
                  dateTime={m.kickoff}
                  className="block text-[10px] font-semibold tabular-nums leading-tight text-primary"
                >
                  {formatKickoff(m.kickoff, "d. MMM", locale)}
                </time>
                <span className="text-[11px] font-bold tabular-nums">
                  {m.status === "finished"
                    ? scoreDisplay(m.homeScore, m.awayScore)
                    : formatKickoff(m.kickoff, "HH:mm", locale)}
                </span>
              </>
            )}
          </div>
          <TeamBadge src={homeLogo} name={homeName} />
          <p className="min-w-0 flex-1 truncate text-[13px] font-medium leading-snug">
            {homeName}
            <span className="mx-1 font-normal text-muted-foreground">–</span>
            {awayName}
          </p>
          <TeamBadge src={awayLogo} name={awayName} />
          {live && (
            <span className="shrink-0 text-sm font-bold tabular-nums text-live">
              {scoreDisplay(m.homeScore, m.awayScore)}
            </span>
          )}
        </button>
        <Link
          href={`/match/${m.id}`}
          className="shrink-0 text-[10px] font-semibold text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          →
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 pb-1.5 pl-[5rem] sm:pl-[6rem]">
        <p className="truncate text-[10px] text-muted-foreground">{comp}</p>
        <TvChips channels={m.tvChannels} max={2} />
      </div>
    </li>
  );
}

function TeamBadge({ src, name }: { src: string | null; name: string }) {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
      {src ? (
        <Image
          src={src}
          alt=""
          width={20}
          height={20}
          className="h-full w-full object-contain p-0.5"
          unoptimized
        />
      ) : (
        <span className="m-auto text-[8px] font-bold text-muted-foreground">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}
