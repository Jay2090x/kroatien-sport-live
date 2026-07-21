"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import type { Match, Player } from "@/types";
import {
  getAvailabilityMeta,
  getAvailabilityShort,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { getPlayerProfile } from "@/lib/data/player-profiles";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatKickoff, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";

export interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  nextMatch?: Match;
  locale: string;
  liveLabel: string;
  nextPrefix: string;
  onSelect: () => void;
  /** Compact for favorites row – still same slots */
  variant?: "default" | "compact";
}

/**
 * Einheitliche, vergleichbare Spielerkarte (fixed slots).
 */
export function PlayerCard({
  player,
  selected,
  nextMatch,
  locale,
  liveLabel,
  nextPrefix,
  onSelect,
  variant = "default",
}: PlayerCardProps) {
  const t = useTranslations("Players");
  const tStatus = useTranslations("Status");
  const meta = getAvailabilityMeta(player.availability ?? "unknown");
  const out = !isExpectedToPlay(player.availability);
  const short = getAvailabilityShort(player.availability, locale);
  const profile = getPlayerProfile(player.id);
  const stats = resolveStats(player, profile);
  const nextLine = nextMatch
    ? formatNextLine(nextMatch, player, nextPrefix, liveLabel, locale)
    : null;

  const conf = player.availabilityConfidence ?? "unknown";
  const sourceLabel =
    player.availabilitySource === "editorial"
      ? tStatus("srcEditorial")
      : player.availabilitySource === "season_calendar"
        ? tStatus("srcCalendar")
        : player.availabilitySource === "match_signal"
          ? tStatus("srcMatch")
          : tStatus("srcUnknown");

  const statusTitle = [
    meta.emoji,
    short,
    conf !== "confirmed" ? `(${tStatus(conf)})` : "",
    sourceLabel,
    player.availabilityNote,
  ]
    .filter(Boolean)
    .join(" · ");

  const photo = variant === "compact" ? 48 : 56;

  return (
    <div
      className={cn(
        "flex h-full min-h-[7.5rem] w-full gap-2 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/45 hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/25",
        out && player.availability !== "unknown" && "opacity-95"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="grid min-w-0 flex-1 grid-cols-[auto_1fr] grid-rows-[auto_auto_auto_auto] gap-x-2.5 gap-y-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        {/* Photo – always same cell */}
        <div
          className={cn(
            "row-span-3 relative shrink-0 overflow-hidden rounded-xl bg-secondary ring-1",
            out && player.availability === "vacation"
              ? "ring-sky-500/40 grayscale-[25%]"
              : out && player.availability === "injured"
                ? "ring-red-500/40 grayscale-[20%]"
                : "ring-border"
          )}
          style={{ width: photo, height: photo }}
        >
          {player.imageUrl ? (
            <Image
              src={player.imageUrl}
              alt=""
              width={photo}
              height={photo}
              className="h-full w-full object-cover object-top"
              unoptimized
            />
          ) : (
            <User
              className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground"
              aria-hidden
            />
          )}
        </div>

        {/* Name + status */}
        <div className="flex min-w-0 items-start justify-between gap-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight" title={player.name}>
              {player.name}
            </p>
            <p
              className="mt-0.5 truncate text-[11px] text-muted-foreground"
              title={`${player.club}${player.shirtNumber != null ? ` #${player.shirtNumber}` : ""} · ${player.leagueName}`}
            >
              {player.club}
              {player.shirtNumber != null ? ` · #${player.shirtNumber}` : ""}
              {" · "}
              {shortLeague(player.leagueName)}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tabular-nums",
              meta.badgeClass,
              conf === "likely" && "opacity-90",
              conf === "unknown" && "font-semibold"
            )}
            title={statusTitle}
          >
            {meta.emoji !== "·" ? `${meta.emoji} ` : ""}
            {short}
          </span>
        </div>

        {/* Position + stats row – always 3 stats */}
        <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-1">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold">
            {player.position}
          </Badge>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/80 bg-secondary/40 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            <span title={t("statApps")}>
              <b className="text-foreground">{fmtStat(stats.apps)}</b>
              <span className="ml-0.5 opacity-70">S</span>
            </span>
            <span className="opacity-30">|</span>
            <span title={t("statGoals")}>
              <b className="text-foreground">{fmtStat(stats.goals)}</b>
              <span className="ml-0.5 opacity-70">T</span>
            </span>
            <span className="opacity-30">|</span>
            <span title={t("statAssists")}>
              <b className="text-foreground">{fmtStat(stats.assists)}</b>
              <span className="ml-0.5 opacity-70">A</span>
            </span>
          </span>
        </div>

        {/* Next match – always a line */}
        <p
          className={cn(
            "col-span-2 truncate text-[10px] font-medium",
            nextLine ? "text-primary/90" : "text-muted-foreground"
          )}
          title={nextLine ?? t("noMatches")}
        >
          {nextLine ?? t("noMatches")}
        </p>
      </button>

      <FavoriteButton
        playerId={player.id}
        playerName={player.name}
        className="self-center"
      />
    </div>
  );
}

function fmtStat(n: number | null): string {
  return n == null || Number.isNaN(n) ? "–" : String(n);
}

function shortLeague(name: string): string {
  return name.replace(/ · .*$/, "").slice(0, 18);
}

function resolveStats(
  player: Player,
  profile: ReturnType<typeof getPlayerProfile>
): { apps: number | null; goals: number | null; assists: number | null } {
  const hl = profile?.highlight;
  if (hl) {
    return { apps: hl.apps, goals: hl.goals, assists: hl.assists };
  }
  const row = profile?.teams?.[0]?.stats?.[0];
  if (row) {
    return { apps: row.apps, goals: row.goals, assists: row.assists };
  }
  return { apps: null, goals: null, assists: null };
}

function formatNextLine(
  m: Match,
  player: Player,
  prefix: string,
  liveLabel: string,
  locale: string
): string {
  const side = m.croatianPlayers.find((p) => p.playerId === player.id)?.teamSide;
  const rawOpp =
    side === "home"
      ? m.awayTeam
      : side === "away"
        ? m.homeTeam
        : /croatia|kroatien|hrvatska/i.test(m.homeTeam)
          ? m.awayTeam
          : m.homeTeam;
  const opp = localizeTeamName(rawOpp, locale);
  const when = isLiveStatus(m.status)
    ? liveLabel
    : formatKickoff(m.kickoff, "d. MMM HH:mm", locale);
  return `${prefix}: ${when} · vs ${opp}`;
}
