"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, MapPin, Tv2, Users } from "lucide-react";
import type { Match } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatKickoff,
  isLiveStatus,
  scoreDisplay,
} from "@/lib/utils";
import { LEGAL_DISCLAIMER } from "@/lib/constants";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { MatchPlayerChip } from "@/components/players/match-player-chip";
import { TvChips } from "@/components/matches/tv-chips";
import { buildEventChips } from "@/lib/match-events";
import {
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { cn } from "@/lib/utils";

interface MatchModalProps {
  match: Match | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MatchModal({ match, open, onOpenChange }: MatchModalProps) {
  const t = useTranslations("Match");
  const tTv = useTranslations("TV");
  const { players, setPlayerId } = useDashboard();

  if (!match) return null;

  const live = isLiveStatus(match.status);
  const channels = match.tvChannels ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`${match.homeTeam} – ${match.awayTeam}`}
        description={match.leagueName}
        onClose={() => onOpenChange(false)}
        className="sm:max-w-xl"
      >
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
            {t("kickoff")}: {formatKickoff(match.kickoff)}
          </p>
          {match.venue && (
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {match.venue}
            </p>
          )}
          <div className="mt-2 flex justify-center">
            <TvChips channels={channels} max={4} />
          </div>
        </div>

        <section className="mb-6" aria-labelledby="match-croatians">
          <h3
            id="match-croatians"
            className="mb-1 flex items-center gap-2 text-sm font-semibold"
          >
            <Users className="h-4 w-4 text-primary" />
            {t("lineup")}
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Status, Tore, Karten, Auswechslungen – Klick öffnet alle Spiele des
            Spielers
          </p>

          <ul className="space-y-2">
            {match.croatianPlayers.map((p) => {
              const pl = players.find((x) => x.id === p.playerId);
              const playing = isExpectedToPlay(pl?.availability);
              const meta = getAvailabilityMeta(pl?.availability);
              const events = buildEventChips(p, "de");

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
                      onPlayerClick={(id) => {
                        onOpenChange(false);
                        setPlayerId(id);
                      }}
                      variant="full"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-1 text-xs text-muted-foreground">
                      <span>
                        {p.teamSide === "home" ? match.homeTeam : match.awayTeam}
                        {p.position ? ` · ${p.position}` : ""}
                      </span>

                      {!playing ? (
                        <Badge
                          variant="outline"
                          className="border-sky-500/40 text-sky-300"
                        >
                          {meta.emoji} {meta.labelDe}
                        </Badge>
                      ) : p.isStarter === false ? (
                        <Badge variant="muted">{t("bench")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("starter")}</Badge>
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
        </section>

        <section aria-labelledby="match-tv">
          <h3
            id="match-tv"
            className="mb-3 flex items-center gap-2 text-sm font-semibold"
          >
            <Tv2 className="h-4 w-4 text-primary" />
            {t("tvOptions")}
          </h3>

          {channels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Keine TV-Daten hinterlegt. Siehe TV & Streams Sektion.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {channels.map((ch) => (
                <li key={ch.id}>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/50 hover:bg-secondary/50"
                  >
                    <span>
                      <span className="font-medium">{ch.name}</span>
                      {ch.region && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {ch.region}
                        </span>
                      )}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200/90 dark:text-amber-100/80">
            <strong className="font-semibold">{tTv("disclaimerTitle")}: </strong>
            {LEGAL_DISCLAIMER}
          </p>
        </section>

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
