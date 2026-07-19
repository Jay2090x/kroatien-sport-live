"use client";

import { FILTER_CHIPS, DATE_FILTERS } from "@/lib/constants";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";

export function MatchFilters() {
  const { filters, setLeague, setDate, resetFilters, filteredMatches } =
    useDashboard();
  const t = useTranslations("Dashboard");

  return (
    <div className="space-y-2">
      <div
        className="flex gap-1.5 overflow-x-auto pb-0.5"
        role="group"
        aria-label="Liga-Filter"
      >
        {FILTER_CHIPS.map((chip) => {
          const active = filters.league === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setLeague(chip.id)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
                active
                  ? chip.id === "live"
                    ? "border-live bg-live text-white"
                    : "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
              aria-pressed={active}
            >
              {chip.id === "live" && (
                <span
                  className={cn(
                    "mr-1 inline-block h-1.5 w-1.5 rounded-full",
                    active ? "bg-white" : "bg-live"
                  )}
                  aria-hidden
                />
              )}
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex gap-0.5 rounded-md border border-border bg-card p-0.5"
          role="group"
          aria-label="Datum-Filter"
        >
          {DATE_FILTERS.map((d) => {
            const active = filters.date === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDate(d.id)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={active}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {filteredMatches.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-7 px-2 text-[11px]"
            aria-label={t("resetFilters")}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
