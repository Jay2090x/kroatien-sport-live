"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  filterGuideMatches,
  getGuideCatalog,
} from "@/lib/data/guide-catalog";
import type { SportId } from "@/types/guide";
import { GuideMatchCard } from "@/components/guide/guide-match-card";
import { TvGuideToday } from "@/components/guide/tv-guide-today";
import { Input } from "@/components/ui/input";
import { Search, Radio } from "lucide-react";
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
 * Haupt-Board: Live Now + Upcoming + Filter + TV-Guide
 */
export function LiveMatchBoard() {
  const t = useTranslations("Guide");
  const catalog = useMemo(() => getGuideCatalog(), []);
  const [sport, setSport] = useState<SportId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterGuideMatches(catalog.matches, sport, query),
    [catalog.matches, sport, query]
  );

  const live = filtered.filter((m) => m.status === "live");
  const upcoming = filtered
    .filter((m) => m.status === "upcoming")
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );

  return (
    <div className="space-y-6">
      {/* Search + sport chips – mobile first sticky-ish */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-11 rounded-xl border-border bg-card pl-10 text-sm"
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
                    ? "border-croatia-blue bg-[color-mix(in_oklab,var(--croatia-blue)_50%,#0c1220)] text-blue-100"
                    : "border-live bg-live/15 text-live"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`sport.${id}`)}
            </button>
          ))}
        </div>
      </div>

      {sport !== "tv" && (
        <>
          {/* Live Now */}
          <section aria-labelledby="live-now-title">
            <div className="mb-2.5 flex items-center gap-2">
              <Radio className="h-4 w-4 text-live" aria-hidden />
              <h2
                id="live-now-title"
                className="text-base font-bold tracking-tight sm:text-lg"
              >
                {t("liveNow")}
              </h2>
              {live.length > 0 && (
                <span className="live-badge !text-[9px]">{live.length}</span>
              )}
            </div>
            {live.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/50 px-3 py-5 text-center text-sm text-muted-foreground">
                {t("noLive")}
              </p>
            ) : (
              <ul className="grid gap-2.5">
                {live.map((m) => (
                  <li key={m.id}>
                    <GuideMatchCard match={m} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Upcoming */}
          <section aria-labelledby="upcoming-title">
            <h2
              id="upcoming-title"
              className="mb-2.5 text-base font-bold tracking-tight sm:text-lg"
            >
              {t("upcoming")}
            </h2>
            {upcoming.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-card/50 px-3 py-5 text-center text-sm text-muted-foreground">
                {t("noUpcoming")}
              </p>
            ) : (
              <ul className="grid gap-2.5 sm:grid-cols-2">
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
        <TvGuideToday slots={catalog.tvGuide} />
      )}
    </div>
  );
}
