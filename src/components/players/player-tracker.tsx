"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { User, X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatKickoff, isLiveStatus } from "@/lib/utils";
import type { Match, Player, PlayerAvailability } from "@/types";
import {
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { getPlayerProfile } from "@/lib/data/player-profiles";
import { useMemo } from "react";

/**
 * Kompakte Spieler-Liste + nächstes Match pro Spieler
 */
export function PlayerTracker() {
  const t = useTranslations("Players");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const {
    filteredPlayers,
    filters,
    setPlayerId,
    setSearch,
    resetFilters,
    players,
    matches,
  } = useDashboard();

  const nextByPlayer = useMemo(
    () => buildNextMatchIndex(matches),
    [matches]
  );

  const unavailableCount = filteredPlayers.filter(
    (p) => !isExpectedToPlay(p.availability)
  ).length;
  const searching = Boolean(filters.search.trim());

  return (
    <section
      id="players"
      className="scroll-mt-14"
      aria-labelledby="players-title"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="players-title"
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {searching ? (
              <>
                {filteredPlayers.length} / {players.length}{" "}
                {t("results")}
                {filters.search ? ` · „${filters.search}"` : ""}
              </>
            ) : (
              <>
                {t("hint")}
                <span className="text-muted-foreground/90">
                  {" "}
                  · {filteredPlayers.length - unavailableCount} {t("fit")}
                  {unavailableCount > 0
                    ? ` · ${unavailableCount} ${t("out")}`
                    : ""}
                </span>
              </>
            )}
          </p>
        </div>
        {searching && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setSearch("");
              resetFilters();
            }}
          >
            <X className="h-3 w-3" />
            {t("clearFilter")}
          </Button>
        )}
      </div>

      {filteredPlayers.length === 0 ? (
        <EmptyState
          title={t("empty")}
          description={t("emptyHint")}
          actionLabel={t("clearFilter")}
          onAction={() => {
            setSearch("");
            resetFilters();
          }}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <li key={player.id}>
              <PlayerCard
                player={player}
                selected={filters.playerId === player.id}
                nextMatch={nextByPlayer.get(player.id)}
                onSelect={() => setPlayerId(player.id)}
                nextPrefix={t("nextPrefix")}
                liveLabel={tMatch("live")}
                statusText={t(
                  statusKey(player.availability) as
                    | "statusFit"
                    | "statusVacation"
                    | "statusInjured"
                    | "statusSuspended"
                    | "statusSquad"
                    | "statusDoubt"
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function buildNextMatchIndex(matches: Match[]): Map<string, Match> {
  const map = new Map<string, Match>();
  const upcoming = matches
    .filter(
      (m) =>
        m.status === "scheduled" ||
        m.status === "live" ||
        m.status === "halftime" ||
        m.status === "postponed"
    )
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

  for (const m of upcoming) {
    for (const p of m.croatianPlayers) {
      if (!map.has(p.playerId)) map.set(p.playerId, m);
    }
  }
  return map;
}

function PlayerCard({
  player,
  selected,
  onSelect,
  nextMatch,
  nextPrefix,
  liveLabel,
  statusText,
}: {
  player: Player;
  selected: boolean;
  onSelect: () => void;
  nextMatch?: Match;
  nextPrefix: string;
  liveLabel: string;
  statusText: string;
}) {
  const meta = getAvailabilityMeta(player.availability);
  const out = !isExpectedToPlay(player.availability);
  const profile = getPlayerProfile(player.id);
  const hl = profile?.highlight;
  const nextLine = nextMatch
    ? formatNextLine(nextMatch, player, nextPrefix, liveLabel)
    : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border border-border bg-card p-2.5 text-left shadow-sm transition-all hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary ring-2 ring-primary/25",
        out && "opacity-90"
      )}
    >
      <div
        className={cn(
          "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-secondary ring-1 sm:h-16 sm:w-16",
          out ? "ring-sky-500/40 grayscale-[30%]" : "ring-border"
        )}
      >
        {player.imageUrl ? (
          <Image
            src={player.imageUrl}
            alt={player.name}
            width={64}
            height={64}
            className="h-full w-full object-cover object-top"
            unoptimized
          />
        ) : (
          <User className="m-auto h-8 w-8 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">
              {player.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {player.club}
              {player.shirtNumber != null ? ` · #${player.shirtNumber}` : ""}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase",
              meta.badgeClass
            )}
          >
            {meta.emoji} {statusText}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
            {player.position}
          </Badge>
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {player.leagueName}
          </Badge>
          {hl && (
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {hl.apps}S · {hl.goals}T · {hl.assists}A
            </span>
          )}
        </div>

        {nextLine && (
          <p className="mt-1.5 truncate text-[10px] font-medium text-primary/90">
            {nextLine}
          </p>
        )}
      </div>
    </button>
  );
}

function formatNextLine(
  m: Match,
  player: Player,
  prefix: string,
  liveLabel: string
): string {
  const opp =
    /croatia|kroatien|hrvatska/i.test(m.homeTeam) ||
    m.homeTeam.toLowerCase().includes(player.club.toLowerCase().slice(0, 6))
      ? m.awayTeam
      : m.croatianPlayers.find((p) => p.playerId === player.id)?.teamSide ===
          "home"
        ? m.awayTeam
        : m.homeTeam === player.club ||
            m.homeTeam
              .toLowerCase()
              .includes(player.club.split(" ")[0]!.toLowerCase())
          ? m.awayTeam
          : m.homeTeam;

  const when = isLiveStatus(m.status)
    ? liveLabel
    : formatKickoff(m.kickoff, "d. MMM HH:mm");

  return `${prefix}: ${when} · vs ${opp}`;
}

function statusKey(a: PlayerAvailability | undefined): string {
  switch (a) {
    case "vacation":
      return "statusVacation";
    case "injured":
      return "statusInjured";
    case "suspended":
      return "statusSuspended";
    case "not_in_squad":
      return "statusSquad";
    case "doubtful":
      return "statusDoubt";
    default:
      return "statusFit";
  }
}
