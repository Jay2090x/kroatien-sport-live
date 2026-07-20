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
  getAvailabilityLabel,
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { StatusSuggestionForm } from "@/components/players/status-suggestion-form";
import {
  getPlayerProfile,
  buildMinimalProfile,
} from "@/lib/data/player-profiles";
import { cn, formatKickoff, isLiveStatus, scoreDisplay } from "@/lib/utils";
import type { Match } from "@/types";
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

  const upcoming = matches
    .filter(
      (m) =>
        m.croatianPlayers.some((p) => p.playerId === player.id) &&
        m.status !== "finished" &&
        m.status !== "cancelled"
    )
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, 4);

  const recent = matches
    .filter(
      (m) =>
        m.croatianPlayers.some((p) => p.playerId === player.id) &&
        m.status === "finished"
    )
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime())
    .slice(0, 3);

  const meta = getAvailabilityMeta(player.availability);
  const statusLabel = getAvailabilityLabel(player.availability, locale);
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
              >
                {meta.emoji} {statusLabel}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {player.leagueName}
              </Badge>
              {player.shirtNumber != null && (
                <Badge variant="outline" className="text-[10px]">
                  #{player.shirtNumber}
                </Badge>
              )}
            </div>

            <p className="text-sm leading-snug text-muted-foreground line-clamp-3">
              {tLoc(profile.bio, locale)}
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

        {/* Highlight-Stats – sofort sichtbar */}
        {profile.highlight && (
          <div className="mt-3 rounded-xl border-2 border-border bg-secondary/40 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tLoc(profile.highlight.label, locale)}
            </p>
            <div className="mt-1.5 grid grid-cols-4 gap-2 text-center">
              {[
                [profile.highlight.apps, L.apps],
                [profile.highlight.goals, L.goals],
                [profile.highlight.assists, L.assists],
                [profile.highlight.yellow, L.yellow],
              ].map(([n, l]) => (
                <div key={String(l)}>
                  <p className="text-xl font-bold tabular-nums leading-none">
                    {n}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{l}</p>
                </div>
              ))}
            </div>
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

        {/* Stats – eingeklappt max 4 Zeilen */}
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

          {activeStats.length === 0 ? (
            <p className="text-xs text-muted-foreground">{L.noStats}</p>
          ) : (
            <>
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
                      <StatRow key={r.season + tLoc(r.competition, locale)} r={r} locale={locale} />
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
                  {showAllStats ? L.less : `${L.more} (+${activeStats.length - 4})`}
                </button>
              )}
            </>
          )}
        </div>

        {/* Nächste + letzte Spiele kompakt */}
        {(upcoming.length > 0 || recent.length > 0) && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcoming.length > 0 && (
              <div>
                <h3 className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" />
                  {L.next}
                </h3>
                <ul className="space-y-1">
                  {upcoming.map((m) => (
                    <MiniMatch
                      key={m.id}
                      match={m}
                      onOpen={() => setSelectedMatch(m)}
                      liveLabel={tMatch("live")}
                    />
                  ))}
                </ul>
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <h3 className="mb-1 text-[11px] font-bold uppercase text-muted-foreground">
                  {L.recent}
                </h3>
                <ul className="space-y-1">
                  {recent.map((m) => (
                    <MiniMatch
                      key={m.id}
                      match={m}
                      onOpen={() => setSelectedMatch(m)}
                      liveLabel={tMatch("live")}
                    />
                  ))}
                </ul>
              </div>
            )}
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
  onOpen,
  liveLabel,
}: {
  match: Match;
  onOpen: () => void;
  liveLabel: string;
}) {
  const live = isLiveStatus(match.status);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5 text-left text-xs hover:bg-secondary/50"
      >
        <span className="min-w-0 truncate font-medium">
          {match.homeTeam} – {match.awayTeam}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {live
            ? liveLabel
            : match.status === "finished"
              ? scoreDisplay(match.homeScore, match.awayScore)
              : formatKickoff(match.kickoff, "d.M. HH:mm")}
        </span>
      </button>
    </li>
  );
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
