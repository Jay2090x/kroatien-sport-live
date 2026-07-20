"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarDays } from "lucide-react";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { de, enGB, hr } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatTime, isLiveStatus } from "@/lib/utils";
import type { Match } from "@/types";

function dateFnsLocale(locale: string): DateFnsLocale {
  if (locale === "en") return enGB;
  if (locale === "hr") return hr;
  return de;
}

export function UpcomingCalendar() {
  const t = useTranslations("Calendar");
  const tCommon = useTranslations("Common");
  const tMatch = useTranslations("Match");
  const locale = useLocale();
  const dfLocale = dateFnsLocale(locale);
  const { matches, setSelectedMatch } = useDashboard();

  const upcoming = matches
    .filter(
      (m) =>
        m.status === "scheduled" ||
        m.status === "live" ||
        m.status === "halftime"
    )
    .sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime())
    .slice(0, 20);

  const grouped = groupByDay(upcoming);

  return (
    <section
      id="calendar"
      className="scroll-mt-14"
      aria-labelledby="calendar-title"
    >
      <div className="mb-3">
        <h2
          id="calendar-title"
          className="flex items-center gap-1.5 text-lg font-bold tracking-tight sm:text-xl"
        >
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          {t("title")}
        </h2>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([dayKey, dayMatches]) => (
          <div key={dayKey}>
            <h3 className="sticky top-12 z-10 mb-1 bg-background/90 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
              {dayLabel(
                dayKey,
                tCommon("today"),
                tCommon("tomorrow"),
                dfLocale
              )}
            </h3>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {dayMatches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedMatch(m)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:bg-secondary/50"
                  >
                    <time
                      dateTime={m.kickoff}
                      className="w-10 shrink-0 text-xs font-bold tabular-nums text-primary"
                    >
                      {isLiveStatus(m.status) ? (
                        <span className="live-badge !px-1 !text-[9px]">
                          {tMatch("live")}
                        </span>
                      ) : (
                        formatTime(m.kickoff)
                      )}
                    </time>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.homeTeam}{" "}
                        <span className="text-muted-foreground">–</span>{" "}
                        {m.awayTeam}
                      </p>
                      {m.croatianPlayers.length > 0 && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          {m.croatianPlayers
                            .slice(0, 3)
                            .map((p) => p.playerName.split(" ").slice(-1)[0])
                            .join(", ")}
                          {m.croatianPlayers.length > 3
                            ? ` +${m.croatianPlayers.length - 3}`
                            : ""}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className="hidden shrink-0 text-[10px] px-1.5 py-0 sm:inline-flex"
                    >
                      {m.leagueName.replace(/ · .*$/, "").slice(0, 16)}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function groupByDay(matches: Match[]): Record<string, Match[]> {
  const map: Record<string, Match[]> = {};
  for (const m of matches) {
    const key = format(parseISO(m.kickoff), "yyyy-MM-dd");
    if (!map[key]) map[key] = [];
    map[key].push(m);
  }
  return map;
}

function dayLabel(
  isoDay: string,
  today: string,
  tomorrow: string,
  locale: DateFnsLocale
): string {
  const d = parseISO(isoDay);
  if (isToday(d))
    return `${today} · ${format(d, "d. MMMM yyyy", { locale })}`;
  if (isTomorrow(d))
    return `${tomorrow} · ${format(d, "d. MMMM yyyy", { locale })}`;
  return format(d, "EEEE, d. MMMM yyyy", { locale });
}
