"use client";

import { useLocale, useTranslations } from "next-intl";
import { Newspaper, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getDailyNews, type NewsArticle, tNews } from "@/lib/data/news";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Link } from "@/i18n/navigation";
import { NewsListCard } from "@/components/news/news-list-card";
import { isLiveStatus } from "@/lib/utils";

const MUST_READ = 3;
const TICKER_MAX = 8;

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
 * Must-read + Live-Ticker + kurzer Archiv-Link (kein Dump)
 */
export function NewsSection() {
  const t = useTranslations("News");
  const locale = useLocale();
  const { matches, players } = useDashboard();
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

  const { mustRead, ticker, rest } = useMemo(() => {
    const sorted = [...articles].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const liveish = sorted.filter(
      (a) => a.category === "live" || a.featured
    );
    const pickMust =
      liveish.length >= MUST_READ
        ? liveish.slice(0, MUST_READ)
        : sorted.slice(0, MUST_READ);
    const mustIds = new Set(pickMust.map((a) => a.id));
    const tickerItems = sorted
      .filter((a) => !mustIds.has(a.id))
      .slice(0, TICKER_MAX);
    const tickerIds = new Set(tickerItems.map((a) => a.id));
    const restCount = sorted.filter(
      (a) => !mustIds.has(a.id) && !tickerIds.has(a.id)
    ).length;
    return { mustRead: pickMust, ticker: tickerItems, rest: restCount };
  }, [articles]);

  const liveFixtures = useMemo(
    () => matches.filter((m) => isLiveStatus(m.status)).slice(0, 4),
    [matches]
  );

  const jsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: t("title"),
      itemListElement: mustRead.map((a, i) => ({
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
    [mustRead, locale, t]
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
            {t("daily")}
          </Badge>
          <Link
            href="/news"
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("allNews")}
          </Link>
        </div>
      </div>

      {/* Live match ticker strip */}
      {liveFixtures.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
          {liveFixtures.map((m) => (
            <Link
              key={m.id}
              href={`/match/${m.id}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-live/40 bg-live/10 px-2.5 py-1 text-[11px] font-semibold text-live"
            >
              <Radio className="h-3 w-3" aria-hidden />
              {m.homeTeam.slice(0, 12)} {m.homeScore ?? "–"}:{m.awayScore ?? "–"}{" "}
              {m.awayTeam.slice(0, 12)}
            </Link>
          ))}
        </div>
      )}

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("mustRead")}
      </p>
      <ul className="space-y-2">
        {mustRead.map((article) => (
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

      {ticker.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("ticker")}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card/50">
            {ticker.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/news/${a.id}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
                >
                  <span className="min-w-0 truncate text-sm font-medium">
                    {tNews(a.title, locale)}
                  </span>
                  <time
                    dateTime={a.date}
                    className="shrink-0 text-[10px] tabular-nums text-muted-foreground"
                  >
                    {formatNewsDate(a.date, locale)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(rest > 0 || articles.length > mustRead.length) && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          <Link href="/news" className="font-semibold text-primary hover:underline">
            {t("archiveLink", { count: articles.length })}
          </Link>
        </p>
      )}
    </section>
  );
}
