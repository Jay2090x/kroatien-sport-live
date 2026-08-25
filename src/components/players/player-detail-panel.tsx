"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  User,
  CalendarDays,
  AlertCircle,
  ExternalLink,
  Play,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  getAvailabilityDisplayShort,
  getAvailabilityLabel,
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { StatusSuggestionForm } from "@/components/players/status-suggestion-form";
import {
  getPlayerProfile,
  buildMinimalProfile,
} from "@/lib/data/player-profiles";
import { fmtStat, getUniformStatLines } from "@/lib/player-stats";
import { cn, formatKickoff, isLiveStatus, scoreDisplay } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { Link } from "@/i18n/navigation";
import type { Match } from "@/types";
import { clubMatchesForPlayer } from "@/lib/player-schedule";
import { computePlayerAppearances } from "@/lib/player-form";
import {
  highlightHref,
  youtubePlayerMatchUrl,
} from "@/lib/match-video";
import type { Locale } from "@/i18n/routing";
import type { LocaleText, CareerSeasonStat } from "@/types/player-profile";

function tLoc(text: LocaleText, locale: string): string {
  const l = (
    locale === "hr" || locale === "en" || locale === "de" ? locale : "de"
  ) as Locale;
  return text[l] || text.de;
}

/**
 * Kompaktes Profil – alles auf einen Blick, wenig Klicks
 */
export function PlayerDetailPanel() {
  const locale = useLocale();
  const t = useTranslations("PlayerDetail");
  const tMatch = useTranslations("Match");
  const { players, matches, filters, setPlayerId, setSelectedMatch } =
    useDashboard();
  const [teamTab, setTeamTab] = useState(0);
  const [showAllStats, setShowAllStats] = useState(false);

  const player = filters.playerId
    ? players.find((p) => p.id === filters.playerId)
    : null;

  const profile = useMemo(() => {
    if (!player) return null;
    return (
      getPlayerProfile(player.id) ??
      buildMinimalProfile(player.id, player.name, player.club)
    );
  }, [player]);

  if (!player || !profile) return null;

  const safeTeamTab = Math.min(teamTab, Math.max(0, profile.teams.length - 1));

  const clubMs = clubMatchesForPlayer(player, matches);
  const upcoming = clubMs
    .filter((m) => m.status !== "finished" && m.status !== "cancelled")
    .slice(0, 3);
  const recent = [...clubMs]
    .filter((m) => m.status === "finished")
    .sort(
      (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
    )
    .slice(0, 5);
  const recentApps = computePlayerAppearances(
    player.id,
    matches,
    5,
    player
  );

  const meta = getAvailabilityMeta(player.availability);
  const statusLabel = getAvailabilityLabel(player.availability, locale);
  const statusShort = getAvailabilityDisplayShort(player, locale);
  const playing = isExpectedToPlay(player.availability);

  const L = {
    born: t("born"),
    club: t("club"),
    pos: t("position"),
    apps: t("apps"),
    goals: t("goals"),
    assists: t("assists"),
    yellow: "🟨",
    red: "🟥",
    year: t("season"),
    next: t("next"),
    recent: t("recent"),
    stats: t("stats"),
    more: t("moreStats"),
    less: t("less"),
    close: t("close"),
    noStats: t("noStats"),
  };

  const age = (() => {
    const iso = profile.born || player.dateOfBirth;
    if (!iso) return null;
    return Math.floor(
      (Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
  })();

  const activeStats = profile.teams[safeTeamTab]?.stats ?? [];
  const statsPreview = showAllStats ? activeStats : activeStats.slice(0, 4);

  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o) {
          setPlayerId(null);
          setTeamTab(0);
          setShowAllStats(false);
        }
      }}
    >
      <DialogContent
        title={player.name}
        description={`${player.club} · ${player.positionLabel}`}
        onClose={() => setPlayerId(null)}
        className="sm:max-w-2xl"
      >
        {/* Kopf: Foto + Kerninfos */}
        <div className="flex gap-3">
          <div
            className={cn(
              "relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-secondary sm:h-28 sm:w-24",
              !playing && "border-sky-500/40 grayscale-[25%]"
            )}
          >
            {player.imageUrl ? (
              <Image
                src={player.imageUrl}
                alt={player.name}
                fill
                className="object-contain object-bottom p-1"
                unoptimized
              />
            ) : (
              <User className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                  meta.badgeClass
                )}
                title={
                  player.availabilityNote
                    ? `${statusLabel} · ${player.availabilityNote}`
                    : statusLabel
                }
              >
                {statusShort}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {player.leagueName}
              </Badge>
              {player.shirtNumber != null && (
                <Badge variant="outline" className="text-[10px]">
                  #{player.shirtNumber}
                </Badge>
              )}
              <FavoriteButton
                playerId={player.id}
                playerName={player.name}
                size="sm"
              />
            </div>

            <p className="text-sm leading-snug text-muted-foreground">
              {compactBio(tLoc(profile.bio, locale))}
            </p>

            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] sm:text-xs">
              {(profile.born || player.dateOfBirth) && (
                <>
                  <span className="text-muted-foreground">{L.born}</span>
                  <span className="font-medium">
                    {formatBorn(
                      profile.born || player.dateOfBirth!,
                      age,
                      profile.birthPlace
                        ? tLoc(profile.birthPlace, locale)
                        : undefined,
                      locale
                    )}
                  </span>
                </>
              )}
              <span className="text-muted-foreground">{L.club}</span>
              <span className="truncate font-medium">{player.club}</span>
              <span className="text-muted-foreground">{L.pos}</span>
              <span className="font-medium">
                {player.positionLabel} ({player.position})
              </span>
            </div>
          </div>
        </div>

        {/* Letzte Einsätze im Feed – primäre Statistik, nicht Karriere-Lücken */}
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("lastFive")}
          </p>
          {recentApps.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("lastFiveEmpty")}</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-center">
                {(
                  [
                    [recentApps.length, L.apps],
                    [
                      recentApps.reduce((s, a) => s + (a.app.goals ?? 0), 0) ||
                        null,
                      L.goals,
                    ],
                    [
                      recentApps.filter((a) => a.form === "W").length,
                      "W",
                    ],
                    [
                      recentApps.filter((a) => a.form === "L").length,
                      "L",
                    ],
                  ] as const
                ).map(([n, l]) => (
                  <div key={String(l)}>
                    <p className="text-lg font-bold tabular-nums leading-none">
                      {fmtStat(n)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {l}
                    </p>
                  </div>
                ))}
              </div>
              <ul className="space-y-1">
                {recent.map((m) => (
                  <MiniMatch
                    key={m.id}
                    match={m}
                    playerId={player.id}
                    playerName={player.name}
                    onOpen={() => setSelectedMatch(m)}
                    liveLabel={tMatch("live")}
                    locale={locale}
                    videoLabel={t("video")}
                  />
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Karriere nur wenn echte Zahlen existieren */}
        {getUniformStatLines(profile).some((l) => l.apps != null) && (
          <div className="mt-3 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("uniformStats")}
            </p>
            {getUniformStatLines(profile)
              .filter((line) => line.apps != null)
              .map((line) => (
                <div
                  key={line.kind}
                  className="rounded-xl border border-border bg-secondary/40 px-3 py-2"
                >
                  <p className="truncate text-[10px] font-semibold text-muted-foreground">
                    {tLoc(line.label, locale)}
                  </p>
                  <div className="mt-1.5 grid grid-cols-4 gap-2 text-center">
                    {(
                      [
                        [line.apps, L.apps],
                        [line.goals, L.goals],
                        [line.assists, L.assists],
                        [line.yellow, L.yellow],
                      ] as const
                    ).map(([n, l]) => (
                      <div key={String(l)}>
                        <p className="text-lg font-bold tabular-nums leading-none sm:text-xl">
                          {fmtStat(n)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {l}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Links kompakt */}
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.transfermarktUrl && (
            <a
              href={profile.transfermarktUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold hover:border-primary/40"
            >
              <span className="rounded bg-[#1a3150] px-1 py-0.5 text-[9px] text-white">
                tm
              </span>
              Transfermarkt
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
          {profile.youtubeUrl && (
            <a
              href={profile.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-xs font-semibold hover:border-red-500/40"
            >
              <Play className="h-3.5 w-3.5 text-red-500" />
              Highlights
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          )}
        </div>

        {activeStats.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {L.stats}
              </h3>
              {profile.teams.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {profile.teams.map((tab, i) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setTeamTab(i);
                        setShowAllStats(false);
                      }}
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                        safeTeamTab === i
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tLoc(tab.label, locale)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border-2 border-border">
              <table className="w-full min-w-[280px] text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/60 text-[10px] text-muted-foreground">
                    <th className="px-2 py-1.5 font-semibold">{L.year}</th>
                    <th className="px-1.5 py-1.5 text-center font-semibold">
                      {L.apps}
                    </th>
                    <th className="px-1.5 py-1.5 text-center font-semibold">
                      {L.goals}
                    </th>
                    <th className="px-1.5 py-1.5 text-center font-semibold">
                      {L.assists}
                    </th>
                    <th className="px-1.5 py-1.5 text-center font-semibold">
                      {L.yellow}
                    </th>
                    <th className="px-1.5 py-1.5 text-center font-semibold">
                      {L.red}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {statsPreview.map((r) => (
                    <StatRow
                      key={r.season + tLoc(r.competition, locale)}
                      r={r}
                      locale={locale}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {activeStats.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllStats((v) => !v)}
                className="mt-1.5 text-[11px] font-semibold text-primary hover:underline"
              >
                {showAllStats
                  ? L.less
                  : `${L.more} (+${activeStats.length - 4})`}
              </button>
            )}
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-primary" />
              {L.next}
            </h3>
            <ul className="space-y-1">
              {upcoming.map((m) => (
                <MiniMatch
                  key={m.id}
                  match={m}
                  playerId={player.id}
                  playerName={player.name}
                  onOpen={() => setSelectedMatch(m)}
                  liveLabel={tMatch("live")}
                  locale={locale}
                  videoLabel={t("video")}
                />
              ))}
            </ul>
          </div>
        )}

        {!playing && (
          <p className="mt-3 flex items-start gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1.5 text-[11px] text-sky-200">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
            {player.availabilityNote || statusLabel}
          </p>
        )}

        <div className="mt-3">
          <StatusSuggestionForm player={player} />
        </div>

        <div className="mt-3 flex justify-end border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={() => setPlayerId(null)}>
            {L.close}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatRow({
  r,
  locale,
}: {
  r: CareerSeasonStat;
  locale: string;
}) {
  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="px-2 py-1.5">
        <span className="font-medium">{r.season}</span>
        <span className="mt-0.5 block text-[10px] text-muted-foreground">
          {tLoc(r.competition, locale)}
        </span>
      </td>
      <td className="px-1.5 py-1.5 text-center tabular-nums">{r.apps}</td>
      <td className="px-1.5 py-1.5 text-center tabular-nums">{r.goals}</td>
      <td className="px-1.5 py-1.5 text-center tabular-nums">{r.assists}</td>
      <td className="px-1.5 py-1.5 text-center tabular-nums">{r.yellow}</td>
      <td className="px-1.5 py-1.5 text-center tabular-nums">{r.red}</td>
    </tr>
  );
}

function MiniMatch({
  match,
  playerId,
  playerName,
  onOpen,
  liveLabel,
  locale,
  videoLabel,
}: {
  match: Match;
  playerId: string;
  playerName?: string;
  onOpen: () => void;
  liveLabel: string;
  locale: string;
  videoLabel?: string;
}) {
  const live = isLiveStatus(match.status);
  const app = match.croatianPlayers.find((p) => p.playerId === playerId);
  const bits: string[] = [];
  if (app) {
    if (app.didPlay === false) bits.push("DNP");
    else {
      if (app.isStarter) bits.push("XI");
      if (app.minutesPlayed != null) bits.push(`${app.minutesPlayed}'`);
      if (app.substitutedOn != null) bits.push(`↑${app.substitutedOn}'`);
      if (app.substitutedOff != null) bits.push(`↓${app.substitutedOff}'`);
      if (app.goals) bits.push(app.goals > 1 ? `⚽×${app.goals}` : "⚽");
      if (app.yellowCards) bits.push("🟨");
      if (app.redCard) bits.push("🟥");
    }
  }
  return (
    <li>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border border-border px-2 py-1.5 text-left text-xs hover:bg-secondary/50 hover:border-primary/40"
        >
          <div className="flex w-full items-center justify-between gap-2">
            <span className="min-w-0 truncate font-medium">
              {localizeTeamName(match.homeTeam, locale)} –{" "}
              {localizeTeamName(match.awayTeam, locale)}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {live
                ? liveLabel
                : match.status === "finished"
                  ? scoreDisplay(match.homeScore, match.awayScore)
                  : formatKickoff(match.kickoff, "d.M. HH:mm", locale)}
            </span>
          </div>
          {bits.length > 0 && (
            <span className="text-[10px] font-medium tabular-nums text-primary">
              {bits.join(" · ")}
            </span>
          )}
        </button>
        {match.status === "finished" && (
          <a
            href={
              match.videoUrl
                ? highlightHref(match)
                : youtubePlayerMatchUrl(playerName || "", match)
            }
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-red-500/30 p-1.5 text-red-500 hover:bg-red-500/10"
            title={videoLabel || "YouTube"}
            aria-label={videoLabel || "YouTube"}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
          </a>
        )}
        <Link
          href={`/match/${match.id}`}
          className="shrink-0 rounded-lg border border-border px-2 py-1.5 text-[10px] font-semibold text-primary hover:bg-secondary/50"
          title={match.id}
        >
          →
        </Link>
      </div>
    </li>
  );
}

/** Kompakte, vollständige Bio (max. ~320 Zeichen, an Satzende) */
function compactBio(text: string, max = 320): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const last = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("! "),
    cut.lastIndexOf("? ")
  );
  if (last > max * 0.5) return cut.slice(0, last + 1).trim();
  return cut.replace(/\s+\S*$/, "") + "…";
}

function formatBorn(
  iso: string,
  age: number | null,
  place: string | undefined,
  locale: string
): string {
  try {
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString(
      locale === "hr" ? "hr-HR" : locale === "en" ? "en-GB" : "de-DE",
      { day: "numeric", month: "short", year: "numeric" }
    );
    const ageStr =
      age != null
        ? locale === "en"
          ? ` (${age})`
          : locale === "hr"
            ? ` (${age})`
            : ` (${age} J.)`
        : "";
    return place ? `${dateStr}${ageStr}, ${place}` : `${dateStr}${ageStr}`;
  } catch {
    return iso;
  }
}
