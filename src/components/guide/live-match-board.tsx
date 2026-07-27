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
import { Search, Radio, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const SPORTS: SportId[] = [
  "all",
  "football",
  "handball",
  "basketball",
  "waterpolo",
  "tv",
];

/**
 * Ein Board: Live-API + Guide gemergt, TV-Guide aus /api/tv-guide
 */
export function LiveMatchBoard() {
  const t = useTranslations("Guide");
  const locale = useLocale();
  const { matches: liveMatches, lastUpdated, refreshLive, isRefreshing } =
    useDashboard();

  const catalog = useMemo(() => getGuideCatalog(), []);
  const [sport, setSport] = useState<SportId>("all");
  const [query, setQuery] = useState("");
  const [tvSlots, setTvSlots] = useState<TvGuideSlot[]>(catalog.tvGuide);
  const [mergedRemote, setMergedRemote] = useState<GuideMatch[] | null>(null);

  // Client merge immediately from dashboard context (no wait)
  const localMerged = useMemo(
    () => mergeGuideWithLive(catalog.matches, liveMatches, locale),
    [catalog.matches, liveMatches, locale]
  );

  const matches = mergedRemote ?? localMerged;

  // Refresh unified guide + TV schedule from API
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

  const live = filtered.filter((m) => m.status === "live");
  const upcoming = filtered
    .filter((m) => m.status === "upcoming")
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

  return (
    <div className="space-y-8">
      {/* Controls */}
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
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5"
          role="group"
          aria-label={t("sportFilter")}
        >
          {SPORTS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSport(id)}
              aria-pressed={sport === id}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
                sport === id
                  ? id === "tv"
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-live bg-live/15 text-live"
                  : "border-border bg-card/80 text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`sport.${id}`)}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
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

      {sport !== "tv" && (
        <>
          <section aria-labelledby="live-now-title">
            <SectionHeader
              id="live-now-title"
              title={t("liveNow")}
              subtitle={t("liveNowSub")}
              icon={<Radio className="h-4 w-4 text-live" aria-hidden />}
              action={
                live.length > 0 ? (
                  <span className="live-badge !text-[9px]">{live.length}</span>
                ) : null
              }
            />
            {live.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-5 text-center text-sm text-muted-foreground">
                {t("noLive")}
              </p>
            ) : (
              <ul className="grid gap-3">
                {live.map((m) => (
                  <li key={m.id}>
                    <GuideMatchCard match={m} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="upcoming-title">
            <SectionHeader
              id="upcoming-title"
              title={t("upcoming")}
              subtitle={t("upcomingSub")}
              icon={
                <CalendarClock
                  className="h-4 w-4 text-primary"
                  aria-hidden
                />
              }
            />
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-5 text-center text-sm text-muted-foreground">
                {t("noUpcoming")}
              </p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((m) => (
                  <li key={m.id}>
                    <GuideMatchCard match={m} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {(sport === "all" || sport === "tv") && (
        <TvGuideToday slots={tvSlots} />
      )}
    </div>
  );
}
