"use client";

import { useTranslations } from "next-intl";
import { Eye, MapPin, Users } from "lucide-react";
import type { Match } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchPlayerChip } from "@/components/players/match-player-chip";
import {
  cn,
  formatKickoff,
  formatTime,
  isLiveStatus,
  scoreDisplay,
} from "@/lib/utils";

interface MatchCardProps {
  match: Match;
  onWatch: (match: Match) => void;
  /** Dichte Variante für Listen */
  compact?: boolean;
}

export function MatchCard({ match, onWatch, compact }: MatchCardProps) {
  const t = useTranslations("Match");
  const tDash = useTranslations("Dashboard");
  const { players, setPlayerId } = useDashboard();
  const live = isLiveStatus(match.status);
  // Max. 4 Chips, Rest als +N (kein riesiger Kader)
  const shown = match.croatianPlayers.slice(0, 4);
  const extra = match.croatianPlayers.length - shown.length;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:border-primary/40 hover:shadow-md",
        live && "border-live/40 ring-1 ring-live/20"
      )}
    >
      {live && (
        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-live to-transparent"
          aria-hidden
        />
      )}

      <div className={cn("flex flex-col", compact ? "gap-2 p-3" : "gap-2.5 p-3.5")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Badge variant="secondary" className="shrink-0 text-[10px] font-medium px-2 py-0">
              {match.leagueName.replace(/ · .*$/, "")}
            </Badge>
            {live ? (
              <span className="live-badge shrink-0 !text-[10px] !py-0">
                <span className="live-dot !h-1.5 !w-1.5" />
                {match.status === "halftime"
                  ? t("halftime")
                  : `${t("live")}${match.minute != null ? ` ${match.minute}'` : ""}`}
              </span>
            ) : match.status === "finished" ? (
              <Badge variant="muted" className="text-[10px] px-2 py-0">{t("finished")}</Badge>
            ) : (
              <span className="truncate text-[11px] text-muted-foreground">
                {formatKickoff(match.kickoff, "EEE d. MMM")}
              </span>
            )}
          </div>
          {!live && match.status === "scheduled" && (
            <time
              dateTime={match.kickoff}
              className="shrink-0 text-sm font-bold tabular-nums"
            >
              {formatTime(match.kickoff)}
            </time>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <p className="truncate text-right text-sm font-semibold">
            {match.homeTeam}
          </p>
          <div
            className={cn(
              "min-w-[3.5rem] rounded-md px-2 py-1 text-center text-lg font-bold tabular-nums",
              live ? "bg-live/10 text-live" : "bg-secondary text-foreground"
            )}
            aria-label={`Stand ${scoreDisplay(match.homeScore, match.awayScore)}`}
          >
            {scoreDisplay(match.homeScore, match.awayScore)}
          </div>
          <p className="truncate text-sm font-semibold">
            {match.awayTeam}
          </p>
        </div>

        {/* Nur anzeigen wenn es echte Spieler-Infos gibt (max 4) */}
        {shown.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <Users className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
            {shown.map((p) => (
              <MatchPlayerChip
                key={p.playerId + p.teamSide}
                appearance={p}
                player={players.find((x) => x.id === p.playerId)}
                onPlayerClick={(id) => setPlayerId(id)}
                variant="compact"
              />
            ))}
            {extra > 0 && (
              <span className="text-[10px] text-muted-foreground">+{extra}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2">
          {match.venue ? (
            <p className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{match.venue}</span>
            </p>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            variant={live ? "live" : "secondary"}
            className="h-7 px-2.5 text-xs"
            onClick={() => onWatch(match)}
            aria-label={`${tDash("watch")}: ${match.homeTeam} vs ${match.awayTeam}`}
          >
            <Eye className="h-3 w-3" />
            {tDash("watch")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
