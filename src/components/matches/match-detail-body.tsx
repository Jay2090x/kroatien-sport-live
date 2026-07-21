"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPin, Users } from "lucide-react";
import type { Match, Player } from "@/types";
import { Badge } from "@/components/ui/badge";
import {
  formatKickoff,
  isLiveStatus,
  scoreDisplay,
} from "@/lib/utils";
import { MatchPlayerChip } from "@/components/players/match-player-chip";
import { TvChips } from "@/components/matches/tv-chips";
import { MatchTvBlock } from "@/components/matches/match-tv-block";
import { buildEventChips } from "@/lib/match-events";
import {
  getAvailabilityLabel,
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import {
  localizeCompetitionLabel,
  localizeTeamName,
} from "@/lib/team-names";
import { cn } from "@/lib/utils";
import { ShareButton } from "@/components/share/share-button";
import { Link } from "@/i18n/navigation";

interface MatchDetailBodyProps {
  match: Match;
  players: Player[];
  onPlayerClick?: (playerId: string) => void;
  /** Show share with absolute path including locale prefix if needed */
  sharePath: string;
  showShare?: boolean;
}

export function MatchDetailBody({
  match,
  players,
  onPlayerClick,
  sharePath,
  showShare = true,
}: MatchDetailBodyProps) {
  const t = useTranslations("Match");
  const locale = useLocale();

  const live = isLiveStatus(match.status);
  const homeName = localizeTeamName(match.homeTeam, locale);
  const awayName = localizeTeamName(match.awayTeam, locale);
  const leagueLabel = localizeCompetitionLabel(match.leagueName, locale);
  const title = `${homeName} – ${awayName}`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{leagueLabel}</p>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        </div>
        {showShare && (
          <ShareButton
            title={title}
            text={`${title} · ${leagueLabel}`}
            url={sharePath}
          />
        )}
      </div>

      <div className="mb-6 rounded-xl border border-border bg-secondary/40 p-4 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          {live && (
            <span className="live-badge">
              <span className="live-dot !h-1.5 !w-1.5" />
              {match.status === "halftime"
                ? t("halftime")
                : `${t("live")}${match.minute != null ? ` ${match.minute}'` : ""}`}
            </span>
          )}
          {match.status === "finished" && (
            <Badge variant="muted">{t("finished")}</Badge>
          )}
        </div>
        <p className="text-3xl font-bold tabular-nums">
          {scoreDisplay(match.homeScore, match.awayScore)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("kickoff")}:{" "}
          {formatKickoff(match.kickoff, "EEE, d. MMM · HH:mm", locale)}
        </p>
        {match.venue && (
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {match.venue}
          </p>
        )}
        <div className="mt-2 flex justify-center">
          <TvChips channels={match.tvChannels} max={4} />
        </div>
      </div>

      <section className="mb-6" aria-labelledby="match-croatians">
        <h2
          id="match-croatians"
          className="mb-1 flex items-center gap-2 text-sm font-semibold"
        >
          <Users className="h-4 w-4 text-primary" />
          {t("lineup")}
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">{t("lineupHint")}</p>

        {match.croatianPlayers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noPlayers")}</p>
        ) : (
          <ul className="space-y-2">
            {match.croatianPlayers.map((p) => {
              const pl = players.find((x) => x.id === p.playerId);
              const playing = isExpectedToPlay(pl?.availability);
              const meta = getAvailabilityMeta(pl?.availability);
              const statusLabel = getAvailabilityLabel(pl?.availability, locale);
              const events = buildEventChips(p, locale);

              return (
                <li key={p.playerId + p.teamSide}>
                  <div
                    className={cn(
                      "rounded-xl border p-3",
                      !playing
                        ? "border-sky-500/30 bg-sky-500/5"
                        : "border-border bg-card"
                    )}
                  >
                    <MatchPlayerChip
                      appearance={p}
                      player={pl}
                      onPlayerClick={onPlayerClick}
                      variant="full"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-1 text-xs text-muted-foreground">
                      <span>
                        {p.teamSide === "home" ? homeName : awayName}
                        {p.position ? ` · ${p.position}` : ""}
                      </span>
                      {!playing ? (
                        <Badge
                          variant="outline"
                          className="border-sky-500/40 text-sky-300"
                        >
                          {meta.emoji} {statusLabel}
                        </Badge>
                      ) : p.isStarter === false ? (
                        <Badge variant="muted">{t("bench")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("starter")}</Badge>
                      )}
                      {onPlayerClick == null && p.playerId && (
                        <Link
                          href={`/player/${p.playerId}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {t("matchesArrow")}
                        </Link>
                      )}
                    </div>

                    {events.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {events.map((e) => (
                          <span
                            key={e.key}
                            title={e.title}
                            className={cn(
                              "rounded-md border border-border bg-secondary/60 px-2 py-0.5 text-[11px] font-semibold",
                              e.className
                            )}
                          >
                            {e.label}{" "}
                            <span className="font-normal text-muted-foreground">
                              {e.title}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {pl?.availabilityNote && !playing && (
                      <p className="mt-2 text-xs text-sky-200/90">
                        {pl.availabilityNote}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <MatchTvBlock match={match} />
    </div>
  );
}
