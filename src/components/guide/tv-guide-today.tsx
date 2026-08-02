"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { TvGuideSlot } from "@/types/guide";
import { SectionHeader } from "@/components/layout/section-header";
import { cn } from "@/lib/utils";
import { Tv2 } from "lucide-react";

const CHANNELS = ["all", "HRT 1", "HRT 2", "Arena Sport 1", "Sport Klub"] as const;

export function TvGuideToday({ slots }: { slots: TvGuideSlot[] }) {
  const t = useTranslations("Guide");
  const [channel, setChannel] = useState<string>("all");

  const filtered = useMemo(() => {
    const list =
      channel === "all"
        ? slots
        : slots.filter((s) =>
            s.channelName.toLowerCase().includes(channel.toLowerCase().split(" ")[0]!)
          );
    return [...list].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [slots, channel]);

  return (
    <section
      id="tv-guide"
      className="scroll-mt-16"
      aria-labelledby="tv-guide-title"
    >
      <SectionHeader
        id="tv-guide-title"
        title={t("tvGuideTitle")}
        subtitle={t("tvGuideSubtitle")}
        icon={<Tv2 className="h-4 w-4 text-primary" aria-hidden />}
      />

      <div
        className="mb-3 flex gap-1.5 overflow-x-auto pb-1"
        role="tablist"
        aria-label={t("tvChannels")}
      >
        {CHANNELS.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={channel === c}
            onClick={() => setChannel(c)}
            className={cn(
              "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
              channel === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {c === "all" ? t("filterAll") : c}
          </button>
        ))}
      </div>

      <ul className="overflow-hidden rounded-xl border border-border divide-y divide-border bg-card">
        {filtered.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">
            {t("tvEmpty")}
          </li>
        ) : (
          filtered.map((s) => (
            <li
              key={s.id}
              className={cn(
                "flex gap-3 px-3 py-2.5",
                s.isLive && "bg-live/5"
              )}
            >
              <time
                dateTime={s.start}
                className="w-14 shrink-0 text-xs font-bold tabular-nums text-primary"
              >
                {formatTime(s.start)}
              </time>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{s.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {s.channelName}
                  {s.isLive && (
                    <span className="live-badge ml-1.5 !text-[9px] !py-0">
                      LIVE
                    </span>
                  )}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(11, 16);
  }
}
