"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { User } from "lucide-react";
import type { Match, Player } from "@/types";
import {
  getAvailabilityDisplayShort,
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Badge } from "@/components/ui/badge";
import { cn, formatKickoff, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { computePlayerForm, type FormResult } from "@/lib/player-form";

export interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  nextMatch?: Match;
  /** Same match pool for all cards → comparable form */
  allMatches?: Match[];
  locale: string;
  liveLabel: string;
  nextPrefix: string;
  onSelect: () => void;
  variant?: "default" | "compact";
}

/**
 * Professionelle, einheitliche Spielerkarte.
 * Gleiche Slots für alle: Foto · Name · Club · Position · Status · Nächstes Spiel · Form.
 * Keine inkonsistenten Karriere-Stats (WM vs Liga vs Saison).
 */
export function PlayerCard({
  player,
  selected,
  nextMatch,
  allMatches,
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
  const short = getAvailabilityDisplayShort(player, locale);
  const form = allMatches
    ? computePlayerForm(player.id, allMatches, 5)
    : [];
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
    short,
    conf !== "confirmed" ? `(${tStatus(conf)})` : tStatus("confirmed"),
    sourceLabel,
    player.availabilityNote,
  ]
    .filter(Boolean)
    .join(" · ");

  const photo = variant === "compact" ? 52 : 60;
  const age = ageFromDob(player.dateOfBirth);

  return (
    <div
      className={cn(
        "flex h-full w-full gap-2 rounded-xl border border-border bg-card p-2.5 shadow-sm transition-all hover:border-primary/45 hover:shadow-md",
        selected && "border-primary ring-2 ring-primary/25",
        out &&
          player.availability !== "unknown" &&
          player.availability !== "available" &&
          "opacity-95"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="grid min-w-0 flex-1 grid-cols-[auto_1fr] gap-x-2.5 gap-y-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        {/* Photo */}
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-xl bg-secondary ring-1 row-span-4 self-start",
            player.availability === "injured"
              ? "ring-red-500/40"
              : player.availability === "vacation"
                ? "ring-sky-500/35"
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
            <p
              className="truncate text-sm font-bold leading-tight tracking-tight"
              title={player.name}
            >
              {player.name}
            </p>
            <p
              className="mt-0.5 truncate text-[11px] text-muted-foreground"
              title={`${player.club} · ${player.leagueName}`}
            >
              {player.club}
              <span className="text-muted-foreground/70">
                {" · "}
                {shortLeague(player.leagueName)}
              </span>
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tabular-nums",
              meta.badgeClass,
              conf === "unknown" && "opacity-90"
            )}
            title={statusTitle}
          >
            {short}
          </span>
        </div>

        {/* Comparable meta: position · age · shirt – same for every player */}
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold">
            {player.position}
          </Badge>
          {age != null && (
            <span
              className="rounded-md border border-border/70 bg-secondary/40 px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground"
              title={t("age")}
            >
              {age}
            </span>
          )}
          {player.shirtNumber != null && (
            <span className="rounded-md border border-border/70 bg-secondary/40 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
              #{player.shirtNumber}
            </span>
          )}
        </div>

        {/* Next match – primary comparable value */}
        <p
          className={cn(
            "min-w-0 truncate text-[11px] font-medium leading-snug",
            nextLine ? "text-primary" : "text-muted-foreground"
          )}
          title={nextLine ?? t("noMatches")}
        >
          {nextLine ?? t("noMatches")}
        </p>

        {/* Form from same feed for everyone – never mix career tables */}
        <div
          className="flex min-h-[1rem] items-center gap-1"
          title={form.length ? t("formHint") : t("formEmpty")}
        >
          <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("form")}
          </span>
          {form.length > 0 ? (
            form.map((r, i) => <FormDot key={`${r}-${i}`} result={r} />)
          ) : (
            <span className="text-[10px] text-muted-foreground/80">–</span>
          )}
        </div>
      </button>

      <FavoriteButton
        playerId={player.id}
        playerName={player.name}
        className="self-center"
      />
    </div>
  );
}

function ageFromDob(iso?: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 15 && age <= 50 ? age : null;
}

function shortLeague(name: string): string {
  return name.replace(/ · .*$/, "").slice(0, 16);
}

function FormDot({ result }: { result: FormResult }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 items-center justify-center rounded-sm text-[9px] font-black",
        result === "W" && "bg-emerald-500/20 text-emerald-400",
        result === "D" && "bg-muted text-muted-foreground",
        result === "L" && "bg-red-500/20 text-red-400"
      )}
      aria-label={result}
    >
      {result}
    </span>
  );
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
