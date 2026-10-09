import type { Feed, FeedEntry, FeedMatch } from "@/lib/feed";
import type { NewsItem } from "@/lib/sources/news";
import { dataLabel, dict, type Lang } from "@/lib/i18n";
import { formatDay, formatKickoff, formatTime } from "@/lib/time";
import { ClipPlayer } from "./highlights";
import { NoData, Stand } from "./stand";

function NewsLine({ n, lang, compact }: { n: NewsItem; lang: Lang; compact?: boolean }) {
  const t = dict(lang);
  return (
    <>
      <a href={n.url} target="_blank" rel="noopener noreferrer" lang={n.lang} className={compact ? "fn-link fn-small" : "fn-link"}>
        {n.title}
      </a>
      <span className="news-meta">
        {n.tag ? <span className="ntag">{t.tags[n.tag]}</span> : null}
        <span className="nlang">{n.lang.toUpperCase()}</span> {n.source} ·{" "}
        <time dateTime={n.publishedAt}>
          {formatKickoff(n.publishedAt, lang)} {t.oclock}
        </time>
      </span>
    </>
  );
}

function MatchHead({ m, lang }: { m: FeedMatch; lang: Lang }) {
  const t = dict(lang);
  const name = (s: string) => (m.kind === "vatreni" ? dataLabel(s, lang) : s);
  const cro = (home: boolean) => (m.kind === "vatreni" && m.croatiaIsHome === home ? " team-cro" : "");
  const label = m.upcoming ? t.feed.preview : t.feed.result;
  const comp = m.kind === "vatreni" ? `🇭🇷 Vatreni · ${dataLabel(m.competition, lang)}` : `⚽ SuperSport HNL${m.round ? ` · ${t.feed.round(m.round)}` : ""}`;
  return (
    <>
      <p className="eyebrow">
        {label} · {comp}
      </p>
      <p className="fs-match">
        <span className={`team${cro(true)}`}>{name(m.home)}</span>
        <span className="fs-score">{m.upcoming || m.homeScore == null ? "–:–" : `${m.homeScore}:${m.awayScore}`}</span>
        <span className={`team${cro(false)}`}>{name(m.away)}</span>
      </p>
      <p className="meta">
        <time dateTime={m.kickoff}>
          {formatDay(m.kickoff, lang)}, {formatTime(m.kickoff, lang)} {t.oclock}
        </time>{" "}
        · <a href={m.kind === "vatreni" ? "#vatreni" : "#hnl"}>{m.kind === "vatreni" ? t.feed.toVatreni : t.feed.toHnl}</a>
      </p>
    </>
  );
}

function Entry({ e, lang }: { e: FeedEntry; lang: Lang }) {
  const t = dict(lang);
  if (e.type === "news") {
    return (
      <li className="fe fe-news">
        <NewsLine n={e.item} lang={lang} />
      </li>
    );
  }
  return (
    <li className={`fe fe-story${e.clip ? " fe-has-clip" : ""}`} id={e.id}>
      {e.clip ? (
        <div className="fe-media">
          <ClipPlayer id={e.clip.id} title={e.clip.title} load={t.highlights.load} />
        </div>
      ) : null}
      <div className="fe-info">
        {e.match ? <MatchHead m={e.match} lang={lang} /> : null}
        {e.clip ? (
          <p className="clip-meta fe-clip-meta">
            🎬{" "}
            <a href={`https://www.youtube.com/watch?v=${e.clip.id}`} target="_blank" rel="noopener noreferrer">
              {e.clip.title}
            </a>{" "}
            · {t.highlights.channel} {e.clip.channel} · <time dateTime={e.clip.publishedAt}>{formatKickoff(e.clip.publishedAt, lang)}</time>
          </p>
        ) : null}
        {e.news.length > 0 && (
          <div className="fe-rel">
            {e.match ? <p className="fe-rel-h">{t.feed.related}</p> : null}
            <ul className="news">
              {e.news.map((n) => (
                <li key={n.url}>
                  <NewsLine n={n} lang={lang} compact />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}

export function FeedSection({ feed, lang, fetchedAt }: { feed: Feed | null; lang: Lang; fetchedAt: string | null }) {
  const t = dict(lang);
  return (
    <section id="feed" className="card span-2" aria-labelledby="feed-h">
      <div className="card-head">
        <h2 id="feed-h">⚽ {t.feed.title}</h2>
        <span className="pill">{t.feed.pill}</span>
      </div>
      {!feed ? (
        <NoData what={t.feed.title} lang={lang} />
      ) : feed.entries.length === 0 ? (
        <p className="muted">{t.feed.empty}</p>
      ) : (
        <ul className="feed">
          {feed.entries.map((e) => (
            <Entry key={e.id} e={e} lang={lang} />
          ))}
        </ul>
      )}
      <p className="footnote">{t.feed.note}</p>
      <Stand fetchedAt={fetchedAt} source={t.feed.sources} lang={lang} />
    </section>
  );
}
