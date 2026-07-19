"use client";

import { useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { COMING_SOON_SPORTS } from "@/lib/data/coming-soon-sports";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ComingSoonSports() {
  const isDe = useLocale() !== "en";
  const title = isDe ? "Weitere Sportarten" : "More sports";
  const badge = "Coming Soon";

  return (
    <section
      id="more-sports"
      className="scroll-mt-14"
      aria-labelledby="more-sports-title"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2
          id="more-sports-title"
          className="text-lg font-bold tracking-tight sm:text-xl"
        >
          {title}
        </h2>
        <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
          <Sparkles className="mr-1 h-3 w-3" />
          {badge}
        </Badge>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {COMING_SOON_SPORTS.map((sport) => (
          <li key={sport.id}>
            <article
              className={cn(
                "relative h-full overflow-hidden rounded-lg border border-border bg-card p-2.5",
                "hover:border-primary/30"
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60",
                  sport.accent
                )}
                aria-hidden
              />
              <div className="relative">
                <span className="text-xl" role="img" aria-hidden>
                  {sport.emoji}
                </span>
                <h3 className="mt-1 text-sm font-bold leading-tight">
                  {isDe ? sport.nameDe : sport.nameEn}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">
                  {isDe ? sport.descriptionDe : sport.descriptionEn}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
