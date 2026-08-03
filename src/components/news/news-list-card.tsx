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
import {
  cleanNewsText,
  FALLBACK_THUMB,
  isLogoOrPortrait,
} from "@/lib/data/news-images";

/**
 * Kompakte News-Zeile: festes 72×72 Vorschau · Titel · Teaser · Weiterlesen
 * Logos/Portraits: object-contain; Fotos: object-cover
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
  const tag = cleanNewsText(tNews(article.tag, locale), 80);
  const title =
    cleanNewsText(tNews(article.title, locale), 160) || "…";
  const summary = cleanNewsText(tNews(article.summary, locale), 280);
  const src = article.image?.url || FALLBACK_THUMB;
  const alt = article.image
    ? cleanNewsText(tNews(article.image.alt, locale), 80)
    : title;
  const logoStyle = isLogoOrPortrait(src);
  const isCutout = /cutout/i.test(src);
  const showCat =
    !article.isExternal &&
    tag &&
    !tag.toLowerCase().includes(cat.toLowerCase());

  return (
    <li>
      <article
        className={cn(
          "rounded-xl border border-border/80 bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md",
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
                logoStyle
                  ? isCutout
                    ? "object-contain object-bottom p-0.5"
                    : "object-contain p-1.5"
                  : "object-cover"
              )}
              unoptimized
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {tag && (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] font-medium"
                >
                  {tag}
                </Badge>
              )}
              {showCat && <span>{cat}</span>}
              {showCat && <span aria-hidden>·</span>}
              <time dateTime={article.date}>{dateLabel}</time>
            </div>

            <h3 className="mt-1 text-sm font-semibold leading-snug tracking-tight sm:text-[15px]">
              {article.sourceUrl ? (
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary focus-visible:underline focus-visible:outline-none"
                >
                  {title}
                </a>
              ) : (
                <Link
                  href={`/news/${article.id}`}
                  className="hover:text-primary focus-visible:underline focus-visible:outline-none"
                >
                  {title}
                </Link>
              )}
            </h3>

            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
              {summary}
            </p>

            {article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline"
              >
                {readMoreLabel} →
              </a>
            ) : (
              <Link
                href={`/news/${article.id}`}
                className="mt-1.5 inline-flex text-xs font-semibold text-primary hover:underline"
              >
                {readMoreLabel} →
              </Link>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}
