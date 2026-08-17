"use client";

import { useLocale, useTranslations } from "next-intl";
import { ShieldCheck, CalendarDays, Newspaper } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { isNationalTeamMatch } from "@/lib/data/national-team";
import { Link } from "@/i18n/navigation";
import { formatKickoff, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import { useMemo } from "react";

/**
 * Editorial masthead: who we are, next Vatreni, trust signals.
 */
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
    <header className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] sahovnica-bg"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#c8102e] via-white to-[#171796]" />

      <div className="relative space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          {t("kicker")}
        </p>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {t("lead")}
          </p>
        </div>

        {nextNt ? (
          <Link
            href={`/match/${nextNt.id}`}
            className="block max-w-xl rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-3 transition-colors hover:border-primary/45"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              {t("nextNt")}
            </p>
            <p className="mt-0.5 text-base font-bold leading-snug">
              {localizeTeamName(nextNt.homeTeam, locale)}
              {" – "}
              {localizeTeamName(nextNt.awayTeam, locale)}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {formatKickoff(nextNt.kickoff, "EEE d. MMM · HH:mm", locale)}
              {nextNt.leagueName
                ? ` · ${nextNt.leagueName.replace(/ · .*$/, "")}`
                : ""}
              {nextNt.venue ? ` · ${nextNt.venue}` : ""}
            </p>
          </Link>
        ) : (
          <p className="text-[12px] text-muted-foreground">{t("noNt")}</p>
        )}

        <ul className="flex flex-wrap gap-2 text-[11px]">
          <li className="rounded-full border border-border bg-background/70 px-2.5 py-1 font-semibold tabular-nums">
            {liveCount} {t("statLive")}
          </li>
          <li className="rounded-full border border-border bg-background/70 px-2.5 py-1 font-semibold tabular-nums">
            {weekCount} {t("statWeek")}
          </li>
        </ul>

        <ul className="grid gap-2 sm:grid-cols-3">
          <Trust
            icon={CalendarDays}
            title={t("p1Title")}
            body={t("p1Body")}
          />
          <Trust icon={Newspaper} title={t("p2Title")} body={t("p2Body")} />
          <Trust
            icon={ShieldCheck}
            title={t("p3Title")}
            body={t("p3Body")}
          />
        </ul>
      </div>
    </header>
  );
}

function Trust({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-2.5 rounded-xl border border-border/80 bg-background/50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="text-[12px] font-bold leading-tight">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          {body}
        </p>
      </div>
    </li>
  );
}
