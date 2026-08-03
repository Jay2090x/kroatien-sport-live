"use client";

import { useLocale, useTranslations } from "next-intl";
import { Newspaper, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getDailyNews,
  isStoryNews,
  type NewsArticle,
  tNews,
} from "@/lib/data/news";
import {
  looksLikeHtmlGarbage,
  sanitizeNewsDisplay,
} from "@/lib/data/news-text";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Link } from "@/i18n/navigation";
import { NewsListCard } from "@/components/news/news-list-card";

const HEADLINE_MAX = 8;

function formatNewsDate(iso: string, locale: string): string {
  try {
    const d = parseISO(iso);
    if (locale === "en") return format(d, "d MMM yyyy");
    return format(d, "d. M. yyyy");
  } catch {
    return iso;
  }
}

function isExternal(a: NewsArticle): boolean {
  return Boolean(
    a.isExternal ||
      (a.id.startsWith("auto-") && a.sourceUrl?.startsWith("http"))
  );
}

function storyScore(a: NewsArticle, locale: string): number {
  let s = 0;
  if (a.id.startsWith("editorial-slot-")) s += 100;
  if (a.id.startsWith("daily-brief-")) s += 90;
  if (a.isExternal) s += 40;
  if (a.sourceLang === locale) s += 50;
  if (locale === "de" && a.sourceLang === "hr") s += 20;
  if (a.featured) s += 10;
  const age =
    (Date.now() - new Date(a.date + "T12:00:00Z").getTime()) / (24 * 3600_000);
  if (age <= 2) s += 30;
  else if (age <= 7) s += 10;
  else if (age > 21) s -= 40;
  return s;
}

/**
 * News: Redaktion + Brief + sprachreine Headlines (extern → Original)
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
        if (!cancelled && data?.articles?.length) {
          setRemote(data.articles.filter(isStoryNews));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialArticles, locale]);

  const articles = useMemo(() => {
    const list = [...(remote ?? fallback)]
      .filter(isStoryNews)
      .filter((a) => {
        // Drop any article whose title is HTML garbage
        const title = sanitizeNewsDisplay(tNews(a.title, locale), 140);
        return title.length >= 8 && !looksLikeHtmlGarbage(title);
      })
      .sort((a, b) => storyScore(b, locale) - storyScore(a, locale));
    return list;
  }, [remote, fallback, locale]);

  const editorial = articles.find((a) => a.id.startsWith("editorial-slot-"));
  const brief = articles.find((a) => a.id.startsWith("daily-brief-"));
  const headlines = articles
    .filter(
      (a) =>
        isExternal(a) ||
        (!a.id.startsWith("editorial-slot-") &&
          !a.id.startsWith("daily-brief-") &&
          !a.id.startsWith("live-"))
    )
    .filter((a) => a.id !== editorial?.id && a.id !== brief?.id)
    .slice(0, HEADLINE_MAX);

  return (
    <section id="news" className="scroll-mt-14" aria-labelledby="news-title">
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
            {t("langFeed", {
              lang:
                locale === "en" ? "EN" : locale === "hr" ? "HR" : "DE/HR",
            })}
          </Badge>
          <Link
            href="/news"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("allNews")}
          </Link>
        </div>
      </div>

      {loading && articles.length < 2 && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("loadingHeadlines")}
        </div>
      )}

      {editorial && (
        <div className="mb-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5 sm:p-4">
          <Badge className="text-[10px]">{t("editorialBadge")}</Badge>
          <h3 className="mt-1.5 text-base font-bold leading-snug">
            <Link
              href={`/news/${editorial.id}`}
              className="hover:text-primary"
            >
              {sanitizeNewsDisplay(tNews(editorial.title, locale), 160)}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {sanitizeNewsDisplay(tNews(editorial.summary, locale), 220)}
          </p>
          <Link
            href={`/news/${editorial.id}`}
            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          >
            {t("readEditorial")} →
          </Link>
        </div>
      )}

      {brief && (
        <div className="mb-4 rounded-xl border border-border bg-card p-3.5">
          <Badge variant="secondary" className="text-[10px]">
            {t("briefBadge")}
          </Badge>
          <h3 className="mt-1.5 text-sm font-bold leading-snug">
            <Link href={`/news/${brief.id}`} className="hover:text-primary">
              {sanitizeNewsDisplay(tNews(brief.title, locale), 160)}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {sanitizeNewsDisplay(tNews(brief.summary, locale), 200)}
          </p>
          <Link
            href={`/news/${brief.id}`}
            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          >
            {t("readBrief")} →
          </Link>
        </div>
      )}

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("mustRead")}
      </p>

      {headlines.length === 0 && !loading ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
          {t("emptyStories")}
        </p>
      ) : (
        <ul className="space-y-2">
          {headlines.map((article) => (
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
