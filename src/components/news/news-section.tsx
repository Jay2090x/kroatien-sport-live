"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Newspaper, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getDailyNews,
  isStoryNews,
  type NewsArticle,
  tNews,
} from "@/lib/data/news";
import { cleanNewsText } from "@/lib/data/news-images";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Link } from "@/i18n/navigation";
import { NewsListCard } from "@/components/news/news-list-card";

const MUST_READ = 5;
const TICKER_MAX = 12;

function formatNewsDate(iso: string, locale: string): string {
  try {
    const d = parseISO(iso);
    if (locale === "en") return format(d, "d MMM yyyy");
    return format(d, "d. M. yyyy");
  } catch {
    return iso;
  }
}

function storyScore(a: NewsArticle): number {
  let s = 0;
  if (a.id.startsWith("daily-brief-")) s += 100;
  if (a.id.startsWith("editorial-slot-")) s += 95;
  if (a.id.startsWith("auto-")) s += 55;
  if (a.sourceUrl) s += 25;
  if (!a.id.startsWith("auto-") && !a.id.startsWith("live-")) s += 20;
  if (a.featured) s += 10;
  if (a.category === "transfer" || a.category === "vatreni") s += 8;
  const age =
    (Date.now() - new Date(a.date + "T12:00:00Z").getTime()) / (24 * 3600_000);
  if (age <= 1) s += 40;
  else if (age <= 3) s += 25;
  else if (age <= 7) s += 12;
  else if (age > 21) s -= 25;
  return s;
}

function isExternal(a: NewsArticle): boolean {
  return Boolean(
    a.isExternal ||
      (a.id.startsWith("auto-") && a.sourceUrl?.startsWith("http"))
  );
}

/**
 * News-UI: Redaktions-Slot + Brief + externe Headlines (nur Karten → Original)
 */
export function NewsSection({
  initialArticles,
}: {
  initialArticles?: NewsArticle[];
}) {
  const t = useTranslations("News");
  const locale = useLocale();
  const { matches, players } = useDashboard();
  const [remote, setRemote] = useState<NewsArticle[] | null>(null);
  const [loading, setLoading] = useState(!initialArticles?.length);
  const [fetchFailed, setFetchFailed] = useState(false);

  const fallback = useMemo(
    () =>
      (initialArticles?.length
        ? initialArticles
        : getDailyNews(new Date(), { matches, players })
      ).filter(isStoryNews),
    [initialArticles, matches, players]
  );

  useEffect(() => {
    if (
      initialArticles?.some(
        (a) =>
          a.id.startsWith("auto-") ||
          a.id.startsWith("daily-brief-") ||
          a.id.startsWith("editorial-slot-")
      )
    ) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/news?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { articles?: NewsArticle[] } | null) => {
        if (cancelled) return;
        if (data?.articles?.length) {
          setRemote(data.articles.filter(isStoryNews));
          setFetchFailed(false);
        } else {
          setFetchFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialArticles, locale]);

  const articles = useMemo(() => {
    const list = [...(remote ?? fallback)].filter(isStoryNews);
    return list.sort((a, b) => storyScore(b) - storyScore(a));
  }, [remote, fallback]);

  const brief = articles.find((a) => a.id.startsWith("daily-brief-"));
  const editorial = articles.find((a) => a.id.startsWith("editorial-slot-"));
  const rest = articles.filter(
    (a) => a.id !== brief?.id && a.id !== editorial?.id
  );

  const mustRead = rest.slice(0, MUST_READ);
  const ticker = rest.slice(MUST_READ, MUST_READ + TICKER_MAX);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t("title"),
      itemListElement: articles
        .filter((a) => !isExternal(a))
        .slice(0, 12)
        .map((a, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "NewsArticle",
            headline: cleanNewsText(tNews(a.title, locale), 160),
            description: cleanNewsText(tNews(a.summary, locale), 200),
            datePublished: a.date,
            inLanguage: locale,
          },
        })),
    }),
    [articles, locale, t]
  );

  return (
    <section id="news" className="scroll-mt-14" aria-labelledby="news-title">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="news-title"
            className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-xl"
          >
            <Newspaper className="h-5 w-5 text-primary" aria-hidden />
            {t("title")}
          </h2>
          <p className="text-xs text-muted-foreground">{t("subtitleValue")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {t("daily")} · {articles.length}
          </Badge>
          <Link
            href="/news"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("allNews")}
          </Link>
        </div>
      </div>

      {loading && !articles.length && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("loadingHeadlines")}
        </div>
      )}

      {fetchFailed && !mustRead.length && articles.length <= 2 && (
        <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
          {t("headlinesDegraded")}
        </p>
      )}

      {/* Redaktioneller Slot */}
      {editorial && (
        <div className="mb-3 rounded-xl border border-primary/25 bg-card p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-[10px]">{tNews(editorial.tag, locale)}</Badge>
            <time
              dateTime={editorial.date}
              className="text-[11px] text-muted-foreground"
            >
              {formatNewsDate(editorial.date, locale)}
            </time>
          </div>
          <h3 className="mt-1.5 text-base font-bold leading-snug sm:text-lg">
            <Link
              href={`/news/${editorial.id}`}
              className="hover:text-primary focus-visible:underline"
            >
              {tNews(editorial.title, locale)}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {tNews(editorial.summary, locale)}
          </p>
          <Link
            href={`/news/${editorial.id}`}
            className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            {t("readEditorial")} →
          </Link>
        </div>
      )}

      {/* Tagesbrief */}
      {brief && (
        <div className="mb-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-[10px]">{tNews(brief.tag, locale)}</Badge>
            <time
              dateTime={brief.date}
              className="text-[11px] text-muted-foreground"
            >
              {formatNewsDate(brief.date, locale)}
            </time>
          </div>
          <h3 className="mt-1.5 text-base font-bold leading-snug sm:text-lg">
            <Link
              href={`/news/${brief.id}`}
              className="hover:text-primary focus-visible:underline"
            >
              {tNews(brief.title, locale)}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {tNews(brief.summary, locale)}
          </p>
          <Link
            href={`/news/${brief.id}`}
            className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            {t("readBrief")} →
          </Link>
        </div>
      )}

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("mustRead")}
      </p>
      {mustRead.length === 0 && !loading ? (
        <p className="rounded-xl border border-dashed border-border bg-card/40 px-3 py-5 text-center text-sm text-muted-foreground">
          {t("emptyStories")}
        </p>
      ) : (
        <ul className="space-y-2">
          {mustRead.map((article) => (
            <NewsListCard
              key={article.id}
              article={article}
              locale={locale}
              dateLabel={formatNewsDate(article.date, locale)}
              readMoreLabel={
                isExternal(article) ? t("openSource") : t("readMore")
              }
              compact
            />
          ))}
        </ul>
      )}

      {ticker.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ticker")}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/50">
            {ticker.map((a) => {
              const title = cleanNewsText(tNews(a.title, locale), 120);
              const external = isExternal(a);
              if (external && a.sourceUrl) {
                return (
                  <li key={a.id}>
                    <a
                      href={a.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {cleanNewsText(tNews(a.tag, locale), 40)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                        {formatNewsDate(a.date, locale)}
                        <ExternalLink className="h-3 w-3" />
                      </span>
                    </a>
                  </li>
                );
              }
              return (
                <li key={a.id}>
                  <Link
                    href={`/news/${a.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">
                      {title}
                    </span>
                    <time
                      dateTime={a.date}
                      className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                    >
                      {formatNewsDate(a.date, locale)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        <Link href="/news" className="font-semibold text-primary hover:underline">
          {t("archiveLink", { count: articles.length })}
        </Link>
        <span className="mx-1.5">·</span>
        <span className="text-[10px]">{t("fixturesOnBoard")}</span>
      </p>
    </section>
  );
}
