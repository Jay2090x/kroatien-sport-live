"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Star, User } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useFavorites } from "@/components/favorites/favorites-context";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { formatKickoff, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import type { Match, Player } from "@/types";
import { useMemo } from "react";

/**
 * „Meine Kroaten“ – Favoriten mit nächstem Spiel
 */
export function MyCroatians() {
  const t = useTranslations("Favorites");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const { players, matches, setPlayerId } = useDashboard();
  const { favoriteIds } = useFavorites();

  const nextByPlayer = useMemo(() => buildNextIndex(matches), [matches]);

  const favPlayers = useMemo(() => {
    const set = new Set(favoriteIds);
    return players.filter((p) => set.has(p.id));
  }, [players, favoriteIds]);

  if (favoriteIds.length === 0) {
    return (
      <section
        id="favorites"
        className="scroll-mt-14 rounded-xl border border-dashed border-border bg-card/40 px-3 py-4 sm:px-4"
        aria-labelledby="favorites-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id="favorites-title"
              className="flex items-center gap-1.5 text-base font-bold tracking-tight sm:text-lg"
            >
              <Star className="h-4 w-4 text-amber-400" aria-hidden />
              {t("title")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("emptyHint")}</p>
          </div>
          <a
            href="#players"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("browsePlayers")}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      id="favorites"
      className="scroll-mt-14"
      aria-labelledby="favorites-title"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="favorites-title"
            className="flex items-center gap-1.5 text-lg font-bold tracking-tight sm:text-xl"
          >
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("subtitle", { count: favPlayers.length })}
          </p>
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {favPlayers.map((player) => (
          <li key={player.id}>
            <FavCard
              player={player}
              nextMatch={nextByPlayer.get(player.id)}
              locale={locale}
              liveLabel={tMatch("live")}
              nextPrefix={t("nextPrefix")}
              onOpen={() => setPlayerId(player.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function FavCard({
  player,
  nextMatch,
  locale,
  liveLabel,
  nextPrefix,
  onOpen,
}: {
  player: Player;
  nextMatch?: Match;
  locale: string;
  liveLabel: string;
  nextPrefix: string;
  onOpen: () => void;
}) {
  const live = nextMatch ? isLiveStatus(nextMatch.status) : false;
  const nextLine = nextMatch
    ? formatNext(nextMatch, player, locale, nextPrefix, liveLabel)
    : null;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-card p-2.5 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-secondary ring-1 ring-border sm:h-14 sm:w-14">
          {player.imageUrl ? (
            <Image
              src={player.imageUrl}
              alt=""
              width={56}
              height={56}
              className="h-full w-full object-cover object-top"
              unoptimized
            />
          ) : (
            <User className="m-auto h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{player.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {player.club}
          </p>
          {nextLine ? (
            live ? (
              <Link
                href={`/match/${nextMatch!.id}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-1 block truncate text-[10px] font-semibold text-live"
              >
                {nextLine}
              </Link>
            ) : (
              <p className="mt-1 truncate text-[10px] font-medium text-primary/90">
                {nextLine}
              </p>
            )
          ) : (
            <Badge variant="outline" className="mt-1 px-1.5 py-0 text-[9px]">
              {player.position}
            </Badge>
          )}
        </div>
      </button>
      <FavoriteButton playerId={player.id} playerName={player.name} />
    </div>
  );
}

function buildNextIndex(matches: Match[]): Map<string, Match> {
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

function formatNext(
  m: Match,
  player: Player,
  locale: string,
  prefix: string,
  liveLabel: string
): string {
  const side = m.croatianPlayers.find((p) => p.playerId === player.id)?.teamSide;
  const oppRaw =
    side === "home"
      ? m.awayTeam
      : side === "away"
        ? m.homeTeam
        : m.homeTeam;
  const opp = localizeTeamName(oppRaw, locale);
  const when = isLiveStatus(m.status)
    ? liveLabel
    : formatKickoff(m.kickoff, "d. MMM HH:mm", locale);
  return `${prefix}: ${when} · vs ${opp}`;
}
