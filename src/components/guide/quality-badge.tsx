"use client";

import type { StreamQuality } from "@/types/guide";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const STYLE: Record<StreamQuality, string> = {
  "hd-1080": "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
  "hd-720": "border-emerald-500/30 bg-emerald-500/10 text-emerald-200/90",
  sd: "border-border bg-secondary text-muted-foreground",
  "croatian-commentary": "badge-croatia text-[10px]",
  stable: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  free: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  "geo-locked": "border-orange-500/40 bg-orange-500/10 text-orange-200",
};

export function QualityBadge({ q }: { q: StreamQuality }) {
  const t = useTranslations("Guide");
  return (
    <span
      className={cn(
        "inline-flex rounded-md border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STYLE[q]
      )}
    >
      {t(`quality.${q}`)}
    </span>
  );
}
