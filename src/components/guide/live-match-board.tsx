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
  Clock,
  ShieldCheck,
  History,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** Fußball standard – andere Sportarten nur bei aktiver Auswahl */
const SPORTS: SportId[] = [
  "football",
  "handball",
  "basketball",
  "waterpolo",
  "all",
  "tv",
];

const MS_48H = 48 * 60 * 60 * 1000;
const MS_7D = 7 * 24 * 60 * 60 * 1000;

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
  const [sport, setSport] = useState<SportId>("football");
  const [query, setQuery] = useState("");
  const [tvSlots, setTvSlots] = useState<TvGuideSlot[]>(catalog.tvGuide);
  const [mergedRemote, setMergedRemote] = useState<GuideMatch[] | null>(null);
  const [showFinished, setShowFinished] = useState(true);

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
    const now = new Date();
    const nowMs = now.getTime();
    const live = filtered.filter((m) => m.status === "live");
    const upcoming = filtered
      .filter((m) => m.status === "upcoming")
      .sort(
        (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      );

    const today: GuideMatch[] = [];
    const next48: GuideMatch[] = [];
    const rest7: GuideMatch[] = [];

    for (const m of upcoming) {
      const k = new Date(m.kickoff);
      const tMs = k.getTime();
      if (Number.isNaN(tMs)) continue;
      if (tMs - nowMs > MS_7D) continue; // hard 7-day window

      if (isSameLocalDay(k, now)) {
        today.push(m);
      } else if (tMs - nowMs <= MS_48H) {
        next48.push(m);
      } else {
        rest7.push(m);
      }
    }

    const finished = filtered
      .filter((m) => m.status === "finished")
      .sort(
        (a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime()
      );

    return { live, today, next48, rest7, finished };
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
        <p className="flex items-start gap-1.5 rounded-lg border border-border/70 bg-secondary/30 px-2.5 py-2 text-[10px] leading-snug text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500/90" aria-hidden />
          <span>{t("transparency")}</span>
        </p>
      </div>

      {sport !== "tv" && (
        <>
          <MatchBucket
            id="live-now-title"
            title={t("liveNow")}
            subtitle={t("liveNowSub")}
            icon={<Radio className="h-4 w-4 text-live" aria-hidden />}
            badge={
              buckets.live.length > 0 ? (
                <span className="live-badge !text-[9px]">
                  {buckets.live.length}
                </span>
              ) : null
            }
            empty={t("noLive")}
            matches={buckets.live}
            cols="1"
          />

          <MatchBucket
            id="today-title"
            title={t("todayTitle")}
            subtitle={t("todaySub")}
            icon={<Clock className="h-4 w-4 text-primary" aria-hidden />}
            badge={
              buckets.today.length > 0 ? (
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {buckets.today.length}
                </span>
              ) : null
            }
            empty={t("noToday")}
            matches={buckets.today}
            cols="2"
          />

          <MatchBucket
            id="next48-title"
            title={t("next48Title")}
            subtitle={t("next48Sub")}
            icon={
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden />
            }
            empty={t("noNext48")}
            matches={buckets.next48}
            cols="2"
          />

          <MatchBucket
            id="week-title"
            title={t("weekTitle")}
            subtitle={t("weekSub")}
            icon={
              <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
            }
            empty={t("noWeek")}
            matches={buckets.rest7}
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
