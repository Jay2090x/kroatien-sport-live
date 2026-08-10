"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, MapPin, Users } from "lucide-react";
import type { GuideMatch, GuideMatchPlayer } from "@/types/guide";
import { StreamRow } from "@/components/guide/stream-row";
import { Countdown } from "@/components/guide/countdown";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function GuideMatchCard({
  match,
  defaultOpen,
}: {
  match: GuideMatch;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("Guide");
  const [open, setOpen] = useState(
    defaultOpen ?? match.status === "live"
  );
  const live = match.status === "live";
  const finished = match.status === "finished";
  const players = match.croatianPlayers ?? [];
  const confirmedStreams = match.streams.filter((s) => s.confirmedLive);

  return (
    <article
      className={cn(
        "guide-card overflow-hidden",
        live && "guide-card-live",
        finished && "opacity-95"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full flex-col gap-2 p-3 text-left sm:p-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {live ? (
              <span className="live-badge !text-[10px]">
                <span className="live-dot !h-1.5 !w-1.5 !bg-[#04120a]" />
                {t("live")}
                {match.minute != null ? ` ${match.minute}'` : ""}
              </span>
            ) : finished ? (
              <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {t("finishedBadge")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                {t("countdown")}
                <Countdown kickoff={match.kickoff} />
              </span>
            )}
            <span className="badge-croatia rounded-md px-1.5 py-0.5 text-[10px] font-bold">
              {match.competitionShort || match.competition}
            </span>
          </div>
          <span className="text-muted-foreground">
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold leading-snug sm:text-lg">
              {match.homeTeam}
            </p>
            <p className="truncate text-base font-bold leading-snug text-muted-foreground sm:text-lg">
              {match.awayTeam}
            </p>
          </div>
          {(live || finished) && (
            <div className="shrink-0 text-right">
              <p
                className={cn(
                  "text-2xl font-black tabular-nums",
                  live && "text-live"
                )}
              >
                {match.homeScore ?? "–"}
              </p>
              <p className="text-2xl font-black tabular-nums text-muted-foreground">
                {match.awayScore ?? "–"}
              </p>
            </div>
          )}
        </div>

        {/* Kroaten + Kurz-Events */}
        {players.length > 0 ? (
          <div className="space-y-1">
            <p className="flex min-w-0 items-start gap-1.5 text-[11px] text-muted-foreground">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="min-w-0 font-semibold text-foreground/90">
                {t("croatians")}
              </span>
            </p>
            <ul className="flex flex-wrap gap-1">
              {players.slice(0, 6).map((p) => (
                <li key={p.playerId || p.playerName}>
                  <PlayerEventChip p={p} t={t} />
                </li>
              ))}
            </ul>
          </div>
        ) : match.sport === "football" ? (
          <p className="text-[10px] text-muted-foreground/80">
            {t("croatiansUnknown")}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {confirmedStreams.length > 0 ? (
            confirmedStreams.slice(0, 4).map((s) => (
              <span
                key={s.id}
                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-200"
                title={t("confirmedLive")}
              >
                {s.brand}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {t("noConfirmedTv")}
            </span>
          )}
          {match.venue && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {match.venue}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border px-3 py-3 sm:px-3.5">
          {players.length > 0 && (
            <div className="mb-2">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t("playerEvents")}
              </p>
              <ul className="space-y-1.5">
                {players.map((p) => (
                  <li
                    key={p.playerId || p.playerName}
                    className="rounded-lg border border-border/70 bg-secondary/30 px-2.5 py-1.5 text-[12px]"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {p.playerId ? (
                        <Link
                          href={`/player/${p.playerId}`}
                          className="font-semibold text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.playerName}
                        </Link>
                      ) : (
                        <span className="font-semibold">{p.playerName}</span>
                      )}
                      <PlayerEventLine p={p} t={t} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("streams")}
          </p>
          {confirmedStreams.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noConfirmedTvHint")}
            </p>
          ) : (
            confirmedStreams.map((s) => <StreamRow key={s.id} stream={s} />)
          )}
          {match.appMatchId && (
            <Link
              href={`/match/${match.appMatchId}`}
              className="inline-block text-xs font-semibold text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t("matchDetails")}
            </Link>
          )}
        </div>
      )}
    </article>
  );
}

function PlayerEventChip({
  p,
  t,
}: {
  p: GuideMatchPlayer;
  t: ReturnType<typeof useTranslations>;
}) {
  const bits: string[] = [shortName(p.playerName)];
  if (p.didPlay === false) bits.push(t("dnpShort"));
  else {
    if (p.minutesPlayed != null) bits.push(`${p.minutesPlayed}'`);
    if (p.goals) bits.push(`⚽${p.goals > 1 ? p.goals : ""}`);
    if (p.substitutedOn != null) bits.push(`↑${p.substitutedOn}'`);
    if (p.substitutedOff != null) bits.push(`↓${p.substitutedOff}'`);
    if (p.yellowCards) bits.push("🟨");
    if (p.redCard) bits.push("🟥");
  }
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-secondary/50 px-1.5 py-0.5 text-[10px] font-medium tabular-nums">
      {bits.join(" · ")}
    </span>
  );
}

function PlayerEventLine({
  p,
  t,
}: {
  p: GuideMatchPlayer;
  t: ReturnType<typeof useTranslations>;
}) {
  const parts: string[] = [];
  if (p.didPlay === false) {
    parts.push(t("didNotPlay"));
  } else {
    if (p.isStarter === true) parts.push(t("startedXI"));
    if (p.isStarter === false && p.substitutedOn != null)
      parts.push(t("fromBench"));
    if (p.minutesPlayed != null)
      parts.push(t("minutesPlayed", { n: p.minutesPlayed }));
    if (p.substitutedOn != null)
      parts.push(t("subOn", { min: p.substitutedOn }));
    if (p.substitutedOff != null)
      parts.push(t("subOff", { min: p.substitutedOff }));
    if (p.goals)
      parts.push(
        p.goals > 1 ? t("goalsN", { n: p.goals }) : t("goalOne")
      );
    if (p.yellowCards) parts.push(t("yellowCard"));
    if (p.redCard) parts.push(t("redCard"));
  }
  if (parts.length === 0) {
    if (p.eventsKnown === false) parts.push(t("eventsUnknown"));
    else parts.push(t("eventsSparse"));
  }
  return (
    <span className="text-[11px] text-muted-foreground">{parts.join(" · ")}</span>
  );
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return parts[parts.length - 1]!;
}
