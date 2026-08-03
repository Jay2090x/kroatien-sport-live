"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink, Newspaper, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getDailyNews,
  isFixturePseudoNews,
  type NewsArticle,
  tNews,
} from "@/lib/data/news";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { Link } from "@/i18n/navigation";
import { NewsListCard } from "@/components/news/news-list-card";
import { isLiveStatus } from "@/lib/utils";

const MUST_READ = 4;
const TICKER_MAX = 10;

function formatNewsDate(iso: string, locale: string): string {
  try {
    const d = parseISO(iso);
    if (locale === "en") return format(d, "d MMM yyyy");
    return format(d, "d. M. yyyy");
  } catch {
    return iso;
  }
}

/** Echte Stories: externe Headlines + Redaktion – keine Fixture-Listen */
function isStoryNews(a: NewsArticle): boolean {
  if (isFixturePseudoNews(a)) return false;
  if (a.id.startsWith("live-upcoming")) return false;
  // Live-Anker nur wenn wirklich live / frisches Ergebnis
  if (a.id.startsWith("live-next-")) return false;
  return true;
}

function storyScore(a: NewsArticle): number {
  let s = 0;
  if (a.id.startsWith("auto-")) s += 50;
  if (a.sourceUrl) s += 20;
  if (!a.id.startsWith("auto-") && !a.id.startsWith("live-")) s += 25;
  if (a.featured) s += 10;
  if (a.category === "transfer" || a.category === "vatreni") s += 8;
  if (a.id.startsWith("live-club-")) s += 30;
  // fresher dates
  const age =
    (Date.now() - new Date(a.date + "T12:00:00Z").getTime()) / (24 * 3600_000);
  if (age <= 1) s += 40;
  else if (age <= 3) s += 25;
  else if (age <= 7) s += 12;
  else if (age > 21) s -= 20;
  return s;
}

/**
 * Must-read = echte Headlines; Live-Match-Chips separat (nicht als „News“).
 */
export function NewsSection() {
  const t = useTranslations("News");
  const locale = useLocale();
  const { matches, players } = useDashboard();
  const [remote, setRemote] = useState<NewsArticle[] | null>(null);

  const fallback = useMemo(
    () =>
      getDailyNews(new Date(), { matches, players }).filter(isStoryNews),
    [matches, players]
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/news")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { articles?: NewsArticle[] } | null) => {
        if (!cancelled && data?.articles?.length) {
          setRemote(data.articles.filter(isStoryNews));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const articles = useMemo(() => {
    const list = [...(remote ?? fallback)];
    return list.sort((a, b) => storyScore(b) - storyScore(a));
  }, [remote, fallback]);

  const { mustRead, ticker } = useMemo(() => {
    const stories = articles.filter(isStoryNews);
    // Prefer auto + editorial for must-read; allow 1 live-club if running
    const preferred = stories.filter(
      (a) =>
        a.id.startsWith("auto-") ||
        a.sourceUrl ||
        (!a.id.startsWith("live-") && a.category !== "live") ||
        a.id.startsWith("live-club-")
    );
    const pool = preferred.length >= MUST_READ ? preferred : stories;
    const must = pool.slice(0, MUST_READ);
    const mustIds = new Set(must.map((a) => a.id));
    const tick = stories
      .filter((a) => !mustIds.has(a.id))
      .slice(0, TICKER_MAX);
    return { mustRead: must, ticker: tick };
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

      {/* Live-Spiele = Kontext-Chips, nicht als News-Story verkauft */}
      {liveFixtures.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("liveNowStrip")}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {liveFixtures.map((m) => (
              <Link
                key={m.id}
                href={`/match/${m.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-live/40 bg-live/10 px-2.5 py-1 text-[11px] font-semibold text-live"
              >
                <Radio className="h-3 w-3" aria-hidden />
                {m.homeTeam.slice(0, 12)} {m.homeScore ?? "–"}:
                {m.awayScore ?? "–"} {m.awayTeam.slice(0, 12)}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("mustRead")}
      </p>
      {mustRead.length === 0 ? (
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
                article.sourceUrl ? t("openSource") : t("readMore")
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
            {ticker.map((a) => (
              <li key={a.id}>
                {a.sourceUrl ? (
                  <a
                    href={a.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span className="min-w-0 truncate text-sm font-medium">
                      {tNews(a.title, locale)}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground">
                      {formatNewsDate(a.date, locale)}
                      <ExternalLink className="h-3 w-3" />
                    </span>
                  </a>
                ) : (
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
                )}
              </li>
            ))}
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
