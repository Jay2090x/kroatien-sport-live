"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CalendarPlus, Star, User } from "lucide-react";
import { useMemo } from "react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useFavorites } from "@/components/favorites/favorites-context";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatKickoff,
  isLiveStatus,
  scoreDisplay,
} from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { buildIcsCalendar, downloadIcs } from "@/lib/ics";
import { suggestPlayers } from "@/lib/player-form";
import type { Match, Player } from "@/types";
import { SITE } from "@/lib/constants";

const MS_7D = 7 * 24 * 60 * 60 * 1000;

/**
 * „Meine Woche“ – Spiele der Favoriten in den nächsten 7 Tagen + ICS + Vorschläge
 */
export function MyWeek() {
  const t = useTranslations("Favorites");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const { players, matches, setPlayerId } = useDashboard();
  const { favoriteIds } = useFavorites();

  const favSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const weekMatches = useMemo(() => {
    const now = Date.now();
    return matches
      .filter((m) => {
        const tMs = new Date(m.kickoff).getTime();
        if (Number.isNaN(tMs)) return false;
        if (m.status === "cancelled") return false;
        if (m.status === "finished") {
          // keep finished from last 24h for context
          return now - tMs < 24 * 60 * 60 * 1000;
        }
        if (tMs < now - 3 * 60 * 60 * 1000) return false;
        if (tMs - now > MS_7D) return false;
        return m.croatianPlayers.some((p) => favSet.has(p.playerId));
      })
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );
  }, [matches, favSet]);

  const suggestions = useMemo(
    () =>
      favoriteIds.length === 0
        ? suggestPlayers(players, matches, 6)
        : [],
    [favoriteIds.length, players, matches]
  );

  function exportIcs() {
    if (weekMatches.length === 0) return;
    const events = weekMatches.map((m) => {
      const croats = m.croatianPlayers
        .filter((p) => favSet.has(p.playerId))
        .map((p) => p.playerName)
        .join(", ");
      return {
        uid: m.id,
        title: `${m.homeTeam} – ${m.awayTeam}`,
        description: [
          m.leagueName,
          croats ? `Kroaten: ${croats}` : "",
          `${SITE.name} – redaktionelle Termine, keine Stream-Garantie.`,
        ]
          .filter(Boolean)
          .join("\n"),
        location: m.venue,
        startIso: m.kickoff,
        durationMin: 120,
      };
    });
    const ics = buildIcsCalendar(events, t("weekCalName"));
    downloadIcs("meine-woche-ksl.ics", ics);
  }

  if (favoriteIds.length === 0) {
    return (
      <section
        id="favorites"
        className="scroll-mt-14 rounded-xl border border-dashed border-border bg-card/40 px-3 py-4 sm:px-4"
        aria-labelledby="my-week-title"
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2
              id="my-week-title"
              className="flex items-center gap-1.5 text-base font-bold tracking-tight sm:text-lg"
            >
              <Star className="h-4 w-4 text-amber-400" aria-hidden />
              {t("weekTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("weekEmptyHint")}
            </p>
          </div>
          <a
            href="#players"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("browsePlayers")}
          </a>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("suggestions")}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((player) => (
                <li key={player.id}>
                  <SuggestCard
                    player={player}
                    onOpen={() => setPlayerId(player.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      id="favorites"
      className="scroll-mt-14"
      aria-labelledby="my-week-title"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="my-week-title"
            className="flex items-center gap-1.5 text-lg font-bold tracking-tight sm:text-xl"
          >
            <Star
              className="h-4 w-4 fill-amber-400 text-amber-400"
              aria-hidden
            />
            {t("weekTitle")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("weekSubtitle", {
              matches: weekMatches.length,
              players: favoriteIds.length,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            disabled={weekMatches.length === 0}
            onClick={exportIcs}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            {t("exportIcs")}
          </Button>
          <a
            href="#players"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("manageFavs")}
          </a>
        </div>
      </div>

      {weekMatches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-5 text-center text-sm text-muted-foreground">
          {t("weekNoMatches")}
        </p>
      ) : (
        <ul className="space-y-2">
          {weekMatches.map((m) => (
            <li key={m.id}>
              <WeekMatchRow
                match={m}
                favSet={favSet}
                locale={locale}
                liveLabel={tMatch("live")}
              />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-[10px] text-muted-foreground">{t("icsLegal")}</p>
    </section>
  );
}

function SuggestCard({
  player,
  onOpen,
}: {
  player: Player;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-secondary ring-1 ring-border">
          {player.imageUrl ? (
            <Image
              src={player.imageUrl}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover object-top"
              unoptimized
            />
          ) : (
            <User className="m-auto h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{player.name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {player.club}
          </p>
        </div>
      </button>
      <FavoriteButton playerId={player.id} playerName={player.name} />
    </div>
  );
}

function WeekMatchRow({
  match: m,
  favSet,
  locale,
  liveLabel,
}: {
  match: Match;
  favSet: Set<string>;
  locale: string;
  liveLabel: string;
}) {
  const live = isLiveStatus(m.status);
  const croats = m.croatianPlayers.filter((p) => favSet.has(p.playerId));

  return (
    <div className="rounded-xl border border-amber-500/20 bg-card px-3 py-2.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {live ? (
              <span className="live-badge !text-[9px]">{liveLabel}</span>
            ) : (
              <time
                dateTime={m.kickoff}
                className="text-[11px] font-semibold tabular-nums text-primary"
              >
                {formatKickoff(m.kickoff, "EEE d. MMM · HH:mm", locale)}
              </time>
            )}
            <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
              {m.leagueName.replace(/ · .*$/, "").slice(0, 22)}
            </Badge>
          </div>
          <p className="mt-0.5 text-sm font-bold">
            {localizeTeamName(m.homeTeam, locale)}
            <span className="mx-1 font-normal text-muted-foreground">–</span>
            {localizeTeamName(m.awayTeam, locale)}
            {(live || m.status === "finished") && (
              <span className="ml-2 tabular-nums text-muted-foreground">
                {scoreDisplay(m.homeScore, m.awayScore)}
              </span>
            )}
          </p>
          {croats.length > 0 && (
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {croats.map((p) => p.playerName).join(", ")}
            </p>
          )}
        </div>
        <Link
          href={`/match/${m.id}`}
          className="shrink-0 text-xs font-semibold text-primary hover:underline"
        >
          →
        </Link>
      </div>
    </div>
  );
}
