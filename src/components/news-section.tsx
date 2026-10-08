import type { Sourced } from "@/lib/cache";
import type { NewsItem } from "@/lib/sources/news";
import { formatKickoff } from "@/lib/time";
import { NoData, Stand } from "./stand";

export function NewsSection({ news }: { news: Sourced<NewsItem[]> | null }) {
  return (
    <section id="news" className="card span-2" aria-labelledby="news-h">
      <div className="card-head">
        <h2 id="news-h">📰 News</h2>
        <span className="pill">Links zum Original</span>
      </div>
      {!news || news.data.length === 0 ? (
        <NoData what="News" />
      ) : (
        <ul className="news">
          {news.data.map((n) => (
            <li key={n.url}>
              <a href={n.url} target="_blank" rel="noopener noreferrer">
                {n.title}
              </a>
              <span className="news-meta">
                {n.source} · <time dateTime={n.publishedAt}>{formatKickoff(n.publishedAt)}</time>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Stand fetchedAt={news?.fetchedAt ?? null} source="HRT Sport, Google News" />
    </section>
  );
}
