"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { User, X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Player, PlayerAvailability } from "@/types";
import {
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { getPlayerProfile } from "@/lib/data/player-profiles";

/**
 * Kompakte, professionelle Spieler-Liste (Filter via globale Suche)
 */
export function PlayerTracker() {
  const t = useTranslations("Players");
  const locale = useLocale();
  const isDe = locale === "de";
  const isHr = locale === "hr";
  const {
    filteredPlayers,
    filters,
    setPlayerId,
    setSearch,
    resetFilters,
    players,
  } = useDashboard();

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
                {isHr ? "treffer" : isDe ? "Treffer" : "results"}
                {filters.search ? ` · „${filters.search}"` : ""}
              </>
            ) : (
              <>
                {isDe
                  ? "Klick = Profil · Suche oben filtert Spieler & Spiele"
                  : isHr
                    ? "Klik = profil · pretraga gore filtrira igrače i utakmice"
                    : "Click = profile · search above filters players & matches"}
                <span className="text-muted-foreground/90">
                  {" "}
                  · {filteredPlayers.length - unavailableCount} fit
                  {unavailableCount > 0
                    ? ` · ${unavailableCount} ${isDe ? "out" : "out"}`
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
            {isDe ? "Filter weg" : isHr ? "Makni filter" : "Clear filter"}
          </Button>
        )}
      </div>

      {filteredPlayers.length === 0 ? (
        <p className="rounded-lg border-2 border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {isDe
            ? "Kein Spieler gefunden."
            : isHr
              ? "Nema igrača."
              : "No players found."}
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlayers.map((player) => (
            <li key={player.id}>
              <PlayerCard
                player={player}
                selected={filters.playerId === player.id}
                locale={locale}
                onSelect={() => setPlayerId(player.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PlayerCard({
  player,
  selected,
  onSelect,
  locale,
}: {
  player: Player;
  selected: boolean;
  onSelect: () => void;
  locale: string;
}) {
  const meta = getAvailabilityMeta(player.availability);
  const out = !isExpectedToPlay(player.availability);
  const profile = getPlayerProfile(player.id);
  const hl = profile?.highlight;
  const isDe = locale === "de";
  const isEn = locale === "en";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl border-2 border-border bg-card p-2 text-left transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary ring-2 ring-primary/25",
        out && "opacity-90"
      )}
    >
      <div
        className={cn(
          "relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary ring-1",
          out ? "ring-sky-500/40 grayscale-[30%]" : "ring-border"
        )}
      >
        {player.imageUrl ? (
          <Image
            src={player.imageUrl}
            alt={player.name}
            width={40}
            height={40}
            className="h-full w-full object-cover object-top"
            unoptimized
          />
        ) : (
          <User className="m-2 h-6 w-6 text-muted-foreground" aria-hidden />
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
            {meta.emoji}{" "}
            {isEn
              ? shortLabelEn(player.availability)
              : shortLabelDe(player.availability)}
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
      </div>
    </button>
  );
}

function shortLabelDe(a?: PlayerAvailability): string {
  switch (a) {
    case "vacation":
      return "Urlaub";
    case "injured":
      return "Verletzt";
    case "suspended":
      return "Gesperrt";
    case "not_in_squad":
      return "Kader";
    case "doubtful":
      return "Fraglich";
    default:
      return "Fit";
  }
}

function shortLabelEn(a?: PlayerAvailability): string {
  switch (a) {
    case "vacation":
      return "Off";
    case "injured":
      return "Injured";
    case "suspended":
      return "Banned";
    case "not_in_squad":
      return "Squad";
    case "doubtful":
      return "Doubt";
    default:
      return "Fit";
  }
}
