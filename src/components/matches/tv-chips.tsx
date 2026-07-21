"use client";

import type { TvChannel } from "@/types";
import { cn } from "@/lib/utils";
import { filterChannelsForMarket } from "@/lib/broadcast-rights";
import { useGeoCountry } from "@/hooks/use-geo-country";
import { useTranslations } from "next-intl";

/** Kompakte TV/Stream-Chips – nur für Nutzerland (Geo) */
export function TvChips({
  channels,
  className,
  max = 3,
  /** Wenn true: ohne Geo nichts anzeigen (Default). */
  requireGeo = true,
}: {
  channels?: TvChannel[];
  className?: string;
  max?: number;
  requireGeo?: boolean;
}) {
  const t = useTranslations("TvRights");
  const { country, ready } = useGeoCountry();

  if (!channels?.length) return null;

  const local = requireGeo
    ? filterChannelsForMarket(channels, country)
    : channels;

  if (!ready && requireGeo) {
    return (
      <span className={cn("text-[10px] text-muted-foreground", className)}>
        …
      </span>
    );
  }

  if (!local.length) {
    return null;
  }

  const shown = local.slice(0, max);
  const extra = local.length - shown.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((c) => (
        <span
          key={`${c.id}-${c.region}`}
          className={cn(
            "inline-flex max-w-[7.5rem] truncate rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
            c.certainty === "confirmed"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
              : "border-border bg-secondary/80 text-foreground/90"
          )}
          title={`${c.name}${c.region ? ` · ${c.region}` : ""}${
            c.certainty === "typical" ? ` · ${t("typical")}` : ""
          }`}
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
