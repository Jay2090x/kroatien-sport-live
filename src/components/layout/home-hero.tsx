"use client";

import { useLocale, useTranslations } from "next-intl";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { isNationalTeamMatch } from "@/lib/data/national-team";
import { Link } from "@/i18n/navigation";
import { formatKickoff, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { useMemo } from "react";

/** Kompakter Kopf: nächstes Länderspiel + Live-Zähler. */
export function HomeHero() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const { matches } = useDashboard();

  const { nextNt, liveCount, weekCount } = useMemo(() => {
    const now = Date.now();
    const live = matches.filter((m) => isLiveStatus(m.status)).length;
    const week = matches.filter((m) => {
      const t0 = new Date(m.kickoff).getTime();
      return (
        (m.status === "scheduled" || isLiveStatus(m.status)) &&
        t0 >= now - 3 * 3600_000 &&
        t0 <= now + 7 * 24 * 3600_000
      );
    }).length;
    const nt = matches
      .filter(
        (m) =>
          isNationalTeamMatch(m) &&
          (m.status === "scheduled" || isLiveStatus(m.status))
      )
      .sort(
        (a, b) =>
          new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
      )[0];
    return { nextNt: nt, liveCount: live, weekCount: week };
  }, [matches]);

  return (
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card px-4 py-4 sm:px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c8102e] via-white to-[#171796]" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight sm:text-2xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{t("leadShort")}</p>
        </div>
        <ul className="flex shrink-0 flex-wrap gap-1.5 text-[11px] font-semibold">
          <li className="rounded-full border border-border px-2.5 py-1 tabular-nums">
            {liveCount} {t("statLive")}
          </li>
          <li className="rounded-full border border-border px-2.5 py-1 tabular-nums">
            {weekCount} {t("statWeek")}
          </li>
        </ul>
      </div>
      {nextNt && (
        <Link
          href={`/match/${nextNt.id}`}
          className="mt-3 block rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 hover:border-primary/45"
        >
          <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
            {t("nextNt")}
          </span>
          <p className="text-sm font-bold">
            {localizeTeamName(nextNt.homeTeam, locale)} –{" "}
            {localizeTeamName(nextNt.awayTeam, locale)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatKickoff(nextNt.kickoff, "EEE d. MMM · HH:mm", locale)}
          </p>
        </Link>
      )}
    </header>
  );
}
