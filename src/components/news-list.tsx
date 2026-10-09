"use client";

import { SPORT_EMOJI, SPORT_SLUG } from "@/lib/sport-meta";
import type { NewsItem, NewsTag } from "@/lib/sources/news";
import { useSportFilter } from "./sport-filter";

export type NewsRow = NewsItem & { when: string };

/** Schlagzeilen (Originalsprache), nach Interesse + Aktualität gereiht, filterbar. */
export function NewsList({
  items,
  tags,
  empty,
  limit,
}: {
  items: NewsRow[];
  tags: Record<NewsTag, string>;
  empty: string;
  limit?: number;
}) {
  const [sport] = useSportFilter();
  const shown = items.filter((n) => !sport || n.sport === sport).slice(0, limit ?? items.length);
  if (shown.length === 0) return <p className="muted">{empty}</p>;
  return (
    <ul className="news">
      {shown.map((n) => (
        <li key={n.url} data-sport={n.sport === "other" ? "other" : SPORT_SLUG[n.sport]}>
          <a href={n.url} target="_blank" rel="noopener noreferrer" lang={n.lang}>
            {n.sport !== "other" && n.sport !== "football" ? <span aria-hidden="true">{SPORT_EMOJI[n.sport]} </span> : null}
            {n.title}
          </a>
          <span className="news-meta">
            {n.tag ? <span className="ntag">{tags[n.tag]}</span> : null}
            <span className="nlang">{n.lang.toUpperCase()}</span> {n.source} · <time dateTime={n.publishedAt}>{n.when}</time>
          </span>
        </li>
      ))}
    </ul>
  );
}
