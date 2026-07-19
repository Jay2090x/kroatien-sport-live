"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Radio, Users, Trophy } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { isLiveStatus } from "@/lib/utils";

export function Hero() {
  const t = useTranslations("Hero");
  const { matches, players, nationalTeamMatches } = useDashboard();

  const liveCount = matches.filter((m) => isLiveStatus(m.status)).length;
  const ntUpcoming = nationalTeamMatches.filter(
    (m) => m.status === "scheduled" || isLiveStatus(m.status)
  ).length;

  return (
    <section
      className="relative overflow-hidden border-b border-border"
      aria-labelledby="hero-title"
    >
      <div className="absolute inset-0 sahovnica-bg opacity-40" aria-hidden />
      <div
        className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/8"
        aria-hidden
      />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="min-w-0 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="live-dot !h-1.5 !w-1.5" aria-hidden />
            {t("badge")}
          </div>
          <h1
            id="hero-title"
            className="text-2xl font-extrabold tracking-tight sm:text-3xl"
          >
            {t("title")}{" "}
            <span className="bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
              {t("titleHighlight")}
            </span>
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="#vatreni"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Nationalteam
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="#dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              {t("ctaMatches")}
            </a>
            <a
              href="#players"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-sm font-semibold transition-colors hover:bg-secondary"
            >
              {t("ctaPlayers")}
            </a>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat
            icon={<Radio className="h-3.5 w-3.5 text-live" />}
            value={String(liveCount)}
            label={t("statsLive")}
          />
          <Stat
            icon={<FlagEmoji />}
            value={String(ntUpcoming)}
            label="Länderspiele"
          />
          <Stat
            icon={<Users className="h-3.5 w-3.5 text-primary" />}
            value={String(players.length)}
            label={t("statsPlayers")}
          />
        </dl>
      </div>
    </section>
  );
}

function FlagEmoji() {
  return <Trophy className="h-3.5 w-3.5 text-primary" aria-hidden />;
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="min-w-[5.5rem] rounded-lg border border-border/60 bg-card/70 px-3 py-2 backdrop-blur">
      <div className="mb-0.5 flex items-center gap-1">{icon}</div>
      <dt className="sr-only">{label}</dt>
      <dd className="text-xl font-bold tabular-nums leading-none">{value}</dd>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
