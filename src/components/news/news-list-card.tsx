"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  tNews,
  NEWS_CATEGORY_LABEL,
  type NewsArticle,
} from "@/lib/data/news";
import { FALLBACK_THUMB } from "@/lib/data/news-images";

/**
 * Kompakte News-Zeile: festes 72×72 Vorschau · Titel · Teaser · Weiterlesen
 */
export function NewsListCard({
  article,
  locale,
  dateLabel,
  readMoreLabel,
  compact = false,
}: {
  article: NewsArticle;
  locale: string;
  dateLabel: string;
  readMoreLabel: string;
  compact?: boolean;
}) {
  const cat = tNews(NEWS_CATEGORY_LABEL[article.category], locale);
  const title = tNews(article.title, locale);
  const summary = tNews(article.summary, locale);
  const src = article.image?.url || FALLBACK_THUMB;
  const alt = article.image ? tNews(article.image.alt, locale) : title;
  const isCutout = /cutout/i.test(src);

  return (
    <li>
      <article
        className={cn(
          "rounded-xl border border-border bg-card transition-colors hover:border-primary/40",
          article.featured && "border-primary/35",
          compact ? "p-2.5" : "p-3"
        )}
      >
        <div className="flex items-start gap-3">
          <Link
            href={`/news/${article.id}`}
            className={cn(
              "relative block h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-border",
              isCutout
                ? "bg-gradient-to-b from-[#0b1f4a] to-[#1a3a6b]"
                : "bg-secondary"
            )}
            tabIndex={-1}
            aria-hidden
          >
            <Image
              src={src}
              alt={alt}
              width={72}
              height={72}
              className={cn(
                "h-full w-full",
                isCutout
                  ? "object-contain object-bottom p-0.5"
                  : "object-cover"
              )}
              unoptimized
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] font-medium"
              >
                {tNews(article.tag, locale)}
              </Badge>
              <span>{cat}</span>
              <span aria-hidden>·</span>
              <time dateTime={article.date}>{dateLabel}</time>
            </div>

            <h3 className="mt-1 text-sm font-semibold leading-snug tracking-tight sm:text-[15px]">
              <Link
                href={`/news/${article.id}`}
                className="hover:text-primary focus-visible:underline focus-visible:outline-none"
              >
                {title}
              </Link>
            </h3>

            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              {summary}
            </p>

            <Link
              href={`/news/${article.id}`}
              className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline"
            >
              {readMoreLabel} →
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}
