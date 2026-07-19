"use client";

import { useLocale, useTranslations } from "next-intl";
import { Newspaper, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDailyNews, type NewsArticle } from "@/lib/data/news";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Link } from "@/i18n/navigation";
import { NewsListCard } from "@/components/news/news-list-card";
import { tNews } from "@/lib/data/news";

const INITIAL = 6;

function formatNewsDate(iso: string, locale: string): string {
  try {
    const d = parseISO(iso);
    if (locale === "en") return format(d, "d MMM yyyy");
    return format(d, "d. M. yyyy");
  } catch {
    return iso;
  }
}

/**
 * Startseiten-News: kompakte, einheitliche Karten + Link „Weiterlesen“
 */
export function NewsSection() {
  const t = useTranslations("News");
  const locale = useLocale();
  const { matches, players } = useDashboard();
  const [showAll, setShowAll] = useState(false);
  const [remote, setRemote] = useState<NewsArticle[] | null>(null);

  const fallback = useMemo(
    () => getDailyNews(new Date(), { matches, players }),
    [matches, players]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { articles?: NewsArticle[] } | null) => {
        if (!cancelled && data?.articles?.length) setRemote(data.articles);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const articles = remote ?? fallback;
  const visible = showAll ? articles : articles.slice(0, INITIAL);

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t("title"),
      itemListElement: articles.slice(0, 12).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "NewsArticle",
          headline: tNews(a.title, locale),
          description: tNews(a.summary, locale),
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
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
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

      <ul className="space-y-2">
        {visible.map((article) => (
          <NewsListCard
            key={article.id}
            article={article}
            locale={locale}
            dateLabel={formatNewsDate(article.date, locale)}
            readMoreLabel={t("readMore")}
            compact
          />
        ))}
      </ul>

      {articles.length > INITIAL && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? (
            <>
              <ChevronUp className="h-4 w-4" />
              {t("showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              {t("showAll", { count: articles.length })}
            </>
          )}
        </Button>
      )}
    </section>
  );
}
