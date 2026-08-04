"use client";

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  tNews,
  NEWS_CATEGORY_LABEL,
  type NewsArticle,
} from "@/lib/data/news";
import {
  FALLBACK_THUMB,
  isLogoOrPortrait,
} from "@/lib/data/news-images";
import {
  looksLikeHtmlGarbage,
  sanitizeNewsDisplay,
} from "@/lib/data/news-text";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

/**
 * News-Karte mit SEO-Teaser unter der Headline (nicht nur „Über Google“).
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
  const tag = sanitizeNewsDisplay(tNews(article.tag, locale), 48);
  const title =
    sanitizeNewsDisplay(tNews(article.title, locale), 160) || "…";

  let summary = sanitizeNewsDisplay(tNews(article.summary, locale), 420);
  if (looksLikeHtmlGarbage(summary)) summary = "";
  // Kein Ersatz durch „Über Google“ mehr – Teaser bleibt SEO-Inhalt

  const siteLabel =
    article.sourceName ||
    (article.sourceUrl ? hostnameOf(article.sourceUrl) : "");

  const src = article.image?.url || FALLBACK_THUMB;
  const alt = article.image
    ? sanitizeNewsDisplay(tNews(article.image.alt, locale), 60)
    : title;
  const logoStyle = isLogoOrPortrait(src);
  const isCutout = /cutout/i.test(src);
  const external = Boolean(
    article.isExternal ||
      (article.sourceUrl?.startsWith("http") && article.id.startsWith("auto-"))
  );

  const langBadge =
    external && article.sourceLang
      ? article.sourceLang.toUpperCase()
      : null;

  const thumb = (
    <div
      className={cn(
        "relative block h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-lg border border-border sm:h-[5.25rem] sm:w-[5.25rem]",
        isCutout
          ? "bg-gradient-to-b from-[#0b1f4a] to-[#1a3a6b]"
          : "bg-secondary"
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={84}
        height={84}
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
    </div>
  );

  return (
    <li>
      <article
        className={cn(
          "rounded-xl border border-border/80 bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-md",
          article.featured && "border-primary/35",
          compact ? "p-3" : "p-3.5"
        )}
      >
        <div className="flex items-start gap-3">
          {external && article.sourceUrl ? (
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              aria-hidden
            >
              {thumb}
            </a>
          ) : (
            <Link href={`/news/${article.id}`} tabIndex={-1} aria-hidden>
              {thumb}
            </Link>
          )}

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
              <Badge
                variant="outline"
                className="px-1.5 py-0 text-[10px] font-medium"
              >
                {cat}
              </Badge>
              {langBadge && external && langBadge !== locale.toUpperCase() && (
                <Badge
                  variant="outline"
                  className="px-1.5 py-0 text-[10px] font-medium"
                >
                  {langBadge}
                </Badge>
              )}
              <time dateTime={article.date}>{dateLabel}</time>
            </div>

            <h3 className="mt-1 text-sm font-semibold leading-snug tracking-tight sm:text-base">
              {external && article.sourceUrl ? (
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

            {summary ? (
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px] sm:leading-relaxed line-clamp-4">
                {summary}
              </p>
            ) : null}

            {external && article.sourceUrl ? (
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span className="truncate">
                  {readMoreLabel}
                  {siteLabel ? ` · ${siteLabel}` : ""}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <Link
                href={`/news/${article.id}`}
                className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
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
