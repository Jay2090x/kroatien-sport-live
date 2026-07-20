"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Newspaper, Radio, Users } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { isLiveStatus } from "@/lib/utils";
import { getDailyNews } from "@/lib/data/news";
import { useMemo } from "react";

export function Hero() {
  const t = useTranslations("Hero");
  const { matches, players, nationalTeamMatches } = useDashboard();

  const liveCount = matches.filter((m) => isLiveStatus(m.status)).length;
  const ntUpcoming = nationalTeamMatches.filter(
    (m) => m.status === "scheduled" || isLiveStatus(m.status)
  ).length;
  const newsCount = useMemo(
    () => getDailyNews(new Date(), { matches, players }).length,
    [matches, players]
  );

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 sahovnica-bg opacity-30" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-background via-background/96 to-primary/10"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-3 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0 max-w-xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/70 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="live-dot !h-1.5 !w-1.5" aria-hidden />
            {t("badge")}
          </div>
          <h1
            id="hero-title"
            className="text-xl font-extrabold tracking-tight sm:text-2xl lg:text-3xl"
          >
            {t("title")}{" "}
            <span className="bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h1>
          <p className="mt-1 max-w-lg text-xs text-muted-foreground sm:text-sm">
            {t("subtitle")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="#vatreni"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:h-9 sm:text-sm"
            >
              {t("ctaNt")}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="#dashboard"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition-colors hover:bg-secondary sm:h-9 sm:text-sm"
            >
              {t("ctaMatches")}
            </a>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 sm:min-w-[20rem]">
          <Stat
            icon={<Radio className="h-3.5 w-3.5 text-live" />}
            value={String(liveCount)}
            label={t("statsLive")}
            href="#dashboard"
            accent={liveCount > 0}
          />
          <Stat
            icon={<Users className="h-3.5 w-3.5 text-primary" />}
            value={String(ntUpcoming)}
            label={t("statsNt")}
            href="#vatreni"
          />
          <Stat
            icon={<Newspaper className="h-3.5 w-3.5 text-primary" />}
            value={String(newsCount)}
            label={t("statsNews")}
            href="#news"
          />
        </dl>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  href,
  accent,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      className={`min-w-0 rounded-xl border px-3 py-2.5 shadow-sm backdrop-blur transition-colors hover:border-primary/40 ${
        accent
          ? "border-live/30 bg-live/5"
          : "border-border/70 bg-card/75"
      }`}
    >
      <div className="mb-1 flex items-center gap-1">{icon}</div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-xl font-bold tabular-nums leading-none sm:text-2xl">
        {value}
      </dd>
      <p className="mt-1 truncate text-[10px] text-muted-foreground">{label}</p>
    </a>
  );
}
