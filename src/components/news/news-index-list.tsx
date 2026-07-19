"use client";

import { format, parseISO } from "date-fns";
import type { NewsArticle } from "@/lib/data/news";
import { NewsListCard } from "@/components/news/news-list-card";

function formatNewsDate(iso: string, locale: string): string {
  try {
    const d = parseISO(iso);
    if (locale === "en") return format(d, "d MMM yyyy");
    return format(d, "d. M. yyyy");
  } catch {
    return iso;
  }
}

export function NewsIndexList({
  articles,
  locale,
  readMore,
}: {
  articles: NewsArticle[];
  locale: string;
  readMore: string;
}) {
  return (
    <ul className="space-y-2">
      {articles.map((a) => (
        <NewsListCard
          key={a.id}
          article={a}
          locale={locale}
          dateLabel={formatNewsDate(a.date, locale)}
          readMoreLabel={readMore}
        />
      ))}
    </ul>
  );
}
