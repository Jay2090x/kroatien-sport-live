"use client";

import { useLocale, useTranslations } from "next-intl";
import { Star, X } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useFavorites } from "@/components/favorites/favorites-context";
import { PlayerCard } from "@/components/players/player-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { isExpectedToPlay } from "@/lib/player-availability";
import type { Match } from "@/types";
import { useMemo } from "react";

/**
 * Kompakte, einheitliche Spieler-Liste
 */
export function PlayerTracker() {
  const t = useTranslations("Players");
  const tFav = useTranslations("Favorites");
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
  const { favoritesOnly, setFavoritesOnly, favoriteIds } = useFavorites();

  const nextByPlayer = useMemo(
    () => buildNextMatchIndex(matches),
    [matches]
  );

  const list = useMemo(() => {
    if (!favoritesOnly) return filteredPlayers;
    const set = new Set(favoriteIds);
    return filteredPlayers.filter((p) => set.has(p.id));
  }, [filteredPlayers, favoritesOnly, favoriteIds]);

  const unavailableCount = list.filter(
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
                {list.length} / {players.length} {t("results")}
                {filters.search ? ` · „${filters.search}"` : ""}
              </>
            ) : (
              <>
                {t("hint")}
                <span className="text-muted-foreground/90">
                  {" "}
                  · {list.length - unavailableCount} {t("fit")}
                  {unavailableCount > 0
                    ? ` · ${unavailableCount} ${t("out")}`
                    : ""}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            aria-pressed={favoritesOnly}
            onClick={() => setFavoritesOnly(!favoritesOnly)}
          >
            <Star
              className={cn("h-3 w-3", favoritesOnly && "fill-current")}
            />
            {tFav("filterOnly")}
            {favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ""}
          </Button>
          {(searching || favoritesOnly) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearch("");
                resetFilters();
                setFavoritesOnly(false);
              }}
            >
              <X className="h-3 w-3" />
              {t("clearFilter")}
            </Button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title={favoritesOnly ? tFav("emptyFilter") : t("empty")}
          description={
            favoritesOnly ? tFav("emptyFilterHint") : t("emptyHint")
          }
          actionLabel={t("clearFilter")}
          onAction={() => {
            setSearch("");
            resetFilters();
            setFavoritesOnly(false);
          }}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((player) => (
            <li key={player.id} className="h-full">
              <PlayerCard
                player={player}
                selected={filters.playerId === player.id}
                nextMatch={nextByPlayer.get(player.id)}
                onSelect={() => setPlayerId(player.id)}
                nextPrefix={t("nextPrefix")}
                liveLabel={tMatch("live")}
                locale={locale}
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
