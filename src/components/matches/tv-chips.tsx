"use client";

import type { TvChannel } from "@/types";
import { cn } from "@/lib/utils";

/** Kompakte TV/Stream-Chips (HRT, DAZN, …) */
export function TvChips({
  channels,
  className,
  max = 3,
}: {
  channels?: TvChannel[];
  className?: string;
  max?: number;
}) {
  if (!channels?.length) return null;
  const shown = channels.slice(0, max);
  const extra = channels.length - shown.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((c) => (
        <span
          key={c.id}
          className="inline-flex max-w-[7rem] truncate rounded-md border border-border bg-secondary/80 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/90"
          title={c.name}
        >
          {shortTvName(c.name)}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-[10px] text-muted-foreground">+{extra}</span>
      )}
    </div>
  );
}

function shortTvName(name: string): string {
  if (/hrt\s*2/i.test(name)) return "HRT 2";
  if (/hrt/i.test(name)) return "HRT";
  if (/dazn/i.test(name)) return "DAZN";
  if (/sky/i.test(name)) return "Sky";
  if (/sport\s*klub|sportklub/i.test(name)) return "Sportklub";
  if (/arena/i.test(name)) return "Arena";
  if (/viaplay/i.test(name)) return "Viaplay";
  if (/max\s*sport/i.test(name)) return "MAX";
  return name.split(/[–—-]/)[0]?.trim().slice(0, 14) || name.slice(0, 14);
}
