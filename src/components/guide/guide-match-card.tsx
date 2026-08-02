"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, MapPin, Users } from "lucide-react";
import type { GuideMatch } from "@/types/guide";
import { StreamRow } from "@/components/guide/stream-row";
import { Countdown } from "@/components/guide/countdown";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function GuideMatchCard({ match }: { match: GuideMatch }) {
  const t = useTranslations("Guide");
  const [open, setOpen] = useState(match.status === "live");
  const live = match.status === "live";
  const players = match.croatianPlayers ?? [];
  const confirmedStreams = match.streams.filter((s) => s.confirmedLive);

  return (
    <article
      className={cn("guide-card overflow-hidden", live && "guide-card-live")}
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
          {(live || match.status === "finished") && (
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

        {/* Croatian players */}
        {players.length > 0 ? (
          <p className="flex min-w-0 items-start gap-1.5 text-[11px] text-muted-foreground">
            <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="font-semibold text-foreground/90">
                {t("croatians")}:{" "}
              </span>
              {players
                .slice(0, 5)
                .map((p) => p.playerName)
                .join(", ")}
              {players.length > 5 ? ` +${players.length - 5}` : ""}
            </span>
          </p>
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
                {t("croatians")}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {players.map((p) => (
                  <li key={p.playerId}>
                    {p.playerId ? (
                      <Link
                        href={`/player/${p.playerId}`}
                        className="rounded-full border border-border bg-secondary/50 px-2 py-0.5 text-[11px] font-medium hover:border-primary/40 hover:text-primary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {p.playerName}
                      </Link>
                    ) : (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px]">
                        {p.playerName}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("streams")}
          </p>
          {confirmedStreams.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noConfirmedTvHint")}</p>
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
