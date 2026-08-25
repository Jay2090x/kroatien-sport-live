"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { User, Radio, Play } from "lucide-react";
import { youtubePlayerMatchUrl, highlightHref } from "@/lib/match-video";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { buildPlayerSchedule } from "@/lib/player-schedule";
import { Link } from "@/i18n/navigation";
import { cn, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";

/**
 * Kern-Mehrwert: alle Kroaten mit nächstem + letztem Club-Spiel auf einen Blick.
 */
export function ValueBoard() {
  const t = useTranslations("ValueBoard");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const { players, matches, setPlayerId } = useDashboard();

  const rows = useMemo(
    () =>
      buildPlayerSchedule(players, matches, locale, tMatch("live"), {
        limit: 20,
        onlyWithFixture: true,
      }),
    [players, matches, locale, tMatch]
  );

  const liveCount = rows.filter(
    (r) => r.next && isLiveStatus(r.next.status)
  ).length;

  return (
    <section
      id="players"
      className="scroll-mt-14"
      aria-labelledby="value-board-title"
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="value-board-title"
            className="text-lg font-bold tracking-tight sm:text-xl"
          >
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        {liveCount > 0 && (
          <span className="live-badge !text-[10px]">
            <span className="live-dot !h-1.5 !w-1.5" />
            {liveCount} {t("liveNow")}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const live = r.next ? isLiveStatus(r.next.status) : false;
              const p = r.player;
              return (
                <li key={p.id}>
                  <div
                    className={cn(
                      "grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-3",
                      live && "bg-live/5"
                    )}
                  >
                    {/* Player */}
                    <button
                      type="button"
                      onClick={() => setPlayerId(p.id)}
                      className="flex min-w-0 items-center gap-2.5 text-left hover:opacity-90"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover object-top"
                            unoptimized
                          />
                        ) : (
                          <User className="absolute inset-0 m-auto h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold leading-tight">
                          {p.shortName || p.name}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {p.club}
                          <span className="text-muted-foreground/70">
                            {" · "}
                            {p.position}
                          </span>
                        </p>
                      </div>
                    </button>

                    {/* Next */}
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("next")}
                      </p>
                      {r.next ? (
                        <Link
                          href={`/match/${r.next.id}`}
                          className={cn(
                            "block truncate text-[12px] font-semibold leading-snug hover:underline",
                            live ? "text-live" : "text-primary"
                          )}
                        >
                          {live && (
                            <Radio className="mr-1 inline h-3 w-3 align-[-1px]" />
                          )}
                          {r.nextLabel}
                        </Link>
                      ) : (
                        <p className="text-[12px] text-muted-foreground">
                          {t("noNext")}
                        </p>
                      )}
                    </div>

                    {/* Last */}
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t("last")}
                      </p>
                      {r.last ? (
                        <div className="flex min-w-0 items-center gap-1.5">
                          <Link
                            href={`/match/${r.last.id}`}
                            className="min-w-0 flex-1 truncate text-[12px] font-medium leading-snug text-foreground/90 hover:underline"
                            title={r.lastLabel ?? undefined}
                          >
                            {r.lastLabel}
                          </Link>
                          <a
                            href={
                              r.last.videoUrl
                                ? highlightHref(r.last)
                                : youtubePlayerMatchUrl(p.name, r.last)
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-md border border-red-500/30 p-0.5 text-red-500 hover:bg-red-500/10"
                            title={t("video")}
                            aria-label={t("video")}
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </a>
                        </div>
                      ) : (
                        <p className="text-[12px] text-muted-foreground">
                          {t("noLast")}
                        </p>
                      )}
                    </div>

                    {/* Form */}
                    <div className="flex items-center gap-0.5 sm:justify-end">
                      {r.form.length > 0 ? (
                        r.form.map((f, i) => (
                          <span
                            key={`${p.id}-${f}-${i}`}
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-black",
                              f === "W" &&
                                "bg-emerald-500/20 text-emerald-400",
                              f === "D" &&
                                "bg-muted text-muted-foreground",
                              f === "L" && "bg-red-500/20 text-red-400"
                            )}
                          >
                            {f}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          –
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Mobile match line context */}
                  {r.next && (
                    <p className="px-3 pb-2 text-[10px] text-muted-foreground sm:hidden">
                      {localizeTeamName(r.next.homeTeam, locale)} –{" "}
                      {localizeTeamName(r.next.awayTeam, locale)}
                      {r.next.homeScore != null &&
                        ` ${r.next.homeScore}:${r.next.awayScore ?? 0}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            {t("footnote")}
          </p>
        </div>
      )}
    </section>
  );
}
