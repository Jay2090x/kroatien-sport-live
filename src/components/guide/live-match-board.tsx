"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  filterGuideMatches,
  getGuideCatalog,
} from "@/lib/data/guide-catalog";
import { mergeGuideWithLive } from "@/lib/data/merge-guide-live";
import type { GuideMatch, SportId, TvGuideSlot } from "@/types/guide";
import { GuideMatchCard } from "@/components/guide/guide-match-card";
import { TvGuideToday } from "@/components/guide/tv-guide-today";
import { SectionHeader } from "@/components/layout/section-header";
import { Input } from "@/components/ui/input";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import {
  Search,
  Radio,
  CalendarClock,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Fußball standard – andere Sportarten nur bei aktiver Auswahl */
const MS_7D = 7 * 24 * 60 * 60 * 1000;

/**
 * Hub: Live · Heute · nächste 48h · Rest der 7 Tage + Transparenz
 */
export function LiveMatchBoard() {
  const t = useTranslations("Guide");
  const locale = useLocale();
  const {
    matches: liveMatches,
    players,
    lastUpdated,
    refreshLive,
    isRefreshing,
  } = useDashboard();

  const catalog = useMemo(() => getGuideCatalog(), []);
  const [sport] = useState<SportId>("football");
  const [query, setQuery] = useState("");
  const [tvSlots, setTvSlots] = useState<TvGuideSlot[]>(catalog.tvGuide);
  const [mergedRemote, setMergedRemote] = useState<GuideMatch[] | null>(null);
  const [showFinished, setShowFinished] = useState(false);

  const localMerged = useMemo(
    () =>
      mergeGuideWithLive(catalog.matches, liveMatches, locale, players),
    [catalog.matches, liveMatches, locale, players]
  );

  const matches = mergedRemote ?? localMerged;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/guide?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: { matches?: GuideMatch[]; tvGuide?: TvGuideSlot[] } | null) => {
          if (cancelled || !data) return;
          if (data.matches?.length) setMergedRemote(data.matches);
          if (data.tvGuide?.length) setTvSlots(data.tvGuide);
        }
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [locale, liveMatches.length, lastUpdated]);

  const filtered = useMemo(
    () => filterGuideMatches(matches, sport, query),
    [matches, sport, query]
  );

  const buckets = useMemo(() => {
    const nowMs = Date.now();
    const live = filtered.filter((m) => m.status === "live");
    const upcoming = filtered
      .filter((m) => m.status === "upcoming")
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );

    const next: GuideMatch[] = [];
    for (const m of upcoming) {
      const tMs = new Date(m.kickoff).getTime();
      if (Number.isNaN(tMs) || tMs - nowMs > MS_7D) continue;
      next.push(m);
    }

    const finished = filtered
      .filter((m) => m.status === "finished")
      .sort(
        (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
      );

    return { live, next, finished };
  }, [filtered]);

  return (
    <div className="space-y-8">
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 rounded-xl border-border bg-card/80 pl-10 text-sm"
            aria-label={t("searchPlaceholder")}
          />
        </div>
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          <p>
            {t("dataHint", {
              live: liveMatches.length,
              guide: matches.length,
            })}
            {" · "}
            <button
              type="button"
              className="font-semibold text-primary hover:underline"
              onClick={() => void refreshLive()}
              disabled={isRefreshing}
            >
              {isRefreshing ? "…" : t("refresh")}
            </button>
          </p>
        </div>
      </div>

      {sport !== "tv" && (
        <>
          {buckets.live.length > 0 && (
            <MatchBucket
              id="live-now-title"
              title={t("liveNow")}
              subtitle={t("liveNowSub")}
              icon={<Radio className="h-4 w-4 text-live" aria-hidden />}
              badge={
                <span className="live-badge !text-[9px]">
                  {buckets.live.length}
                </span>
              }
              empty={t("noLive")}
              matches={buckets.live}
              cols="1"
            />
          )}

          <MatchBucket
            id="upcoming-title"
            title={t("upcoming")}
            subtitle={t("upcomingSub")}
            icon={
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
            }
            badge={
              buckets.next.length > 0 ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {buckets.next.length}
                </span>
              ) : null
            }
            empty={t("noUpcoming")}
            matches={buckets.next}
            cols="2"
          />

          {/* Abgelaufene Spiele – aufklappbar, nicht verschwinden lassen */}
          <section aria-labelledby="finished-title" className="space-y-3">
            <button
              type="button"
              onClick={() => setShowFinished((v) => !v)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-left hover:bg-secondary/40"
            >
              <div className="flex min-w-0 items-center gap-2">
                <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p id="finished-title" className="text-sm font-bold">
                    {t("finishedTitle")}
                    {buckets.finished.length > 0
                      ? ` (${buckets.finished.length})`
                      : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("finishedSub")}
                  </p>
                </div>
              </div>
              {showFinished ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showFinished &&
              (buckets.finished.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-5 text-center text-sm text-muted-foreground">
                  {t("noFinished")}
                </p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {buckets.finished.map((m) => (
                    <li key={m.id}>
                      <GuideMatchCard match={m} defaultOpen={false} />
                    </li>
                  ))}
                </ul>
              ))}
          </section>
        </>
      )}

      {(sport === "all" || sport === "tv") && (
        <TvGuideToday slots={tvSlots} />
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        {t("legalFootnote")}
      </p>
    </div>
  );
}

function MatchBucket({
  id,
  title,
  subtitle,
  icon,
  badge,
  empty,
  matches,
  cols,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  empty: string;
  matches: GuideMatch[];
  cols: "1" | "2";
}) {
  return (
    <section aria-labelledby={id}>
      <SectionHeader
        id={id}
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={badge}
      />
      {matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-5 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul
          className={cn(
            "grid gap-3",
            cols === "2" && "sm:grid-cols-2"
          )}
        >
          {matches.map((m) => (
            <li key={m.id}>
              <GuideMatchCard match={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
