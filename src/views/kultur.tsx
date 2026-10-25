import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ClipPlayer } from "@/components/highlights";
import { NoData, Stand } from "@/components/stand";
import { getCulture, getCultureVideos, pickCulture } from "@/lib/sources/culture";
import { kultur } from "@/lib/culture-i18n";
import type { Fact } from "@/lib/innovation-i18n";
import type { Lang } from "@/lib/i18n";
import { formatShortDate } from "@/lib/time";

function Facts({ items, label }: { items: Fact[]; label: string }) {
  return (
    <ul className="inno-facts">
      {items.map((f) => (
        <li key={f.title} className="inno-fact">
          <p className="inno-fact-title"><span aria-hidden="true">{f.emoji} </span>{f.title}</p>
          <p className="small">{f.text}</p>
          <a className="small" href={f.url} target="_blank" rel="noopener noreferrer">{label}: Wikipedia ↗</a>
        </li>
      ))}
    </ul>
  );
}

export async function KulturView({ lang }: { lang: Lang }) {
  const T = kultur(lang);
  const [pool, vids] = await Promise.all([getCulture(), getCultureVideos()]);
  const items = pool ? pickCulture(pool.data, { lang }) : [];
  return (
    <>
      <SiteHeader lang={lang} path="/kroatien-kultur" />
      <main className="container page-fan">
        <section className="card" aria-labelledby="kul-h">
          <h1 id="kul-h" className="h1">🎬 {T.h1}</h1>
          <p className="intro">{T.intro}</p>
        </section>

        <section className="card" aria-labelledby="inno-news">
          <h2 id="inno-news">📰 {T.news}</h2>
          {!pool ? (
            <NoData what={T.news} lang={lang} />
          ) : items.length === 0 ? (
            <p className="muted">{T.none}</p>
          ) : (
            <ul className="news inno-news">
              {items.map((n) => (
                <li key={n.url}>
                  <a href={n.url} target="_blank" rel="noopener noreferrer" lang={n.lang}>{n.title}</a>
                  <span className="news-meta">{n.source} · <time dateTime={n.publishedAt}>{formatShortDate(n.publishedAt, lang)}</time></span>
                </li>
              ))}
            </ul>
          )}
          <p className="small muted">{T.newsNote}</p>
          {pool ? <Stand fetchedAt={pool.fetchedAt} source={T.sources} lang={lang} /> : null}
        </section>

        <section className="card" aria-labelledby="inno-did">
          <h2 id="inno-did">🧠 {T.did}</h2>
          <p className="small muted">{T.didNote}</p>
          <Facts items={T.facts} label={T.source} />
        </section>

        <section className="card" aria-labelledby="inno-spot">
          <h2 id="inno-spot">🌟 {T.spot}</h2>
          <Facts items={T.people} label={T.source} />
        </section>

        {vids && vids.data.length > 0 ? (
          <section className="card" aria-labelledby="inno-vid">
            <h2 id="inno-vid">📺 {T.videos}</h2>
            <ul className="clips">
              {vids.data.map((v) => (
                <li key={v.id} className="clip">
                  <ClipPlayer id={v.id} title={v.title} load={T.load} />
                  <p className="clip-title">
                    <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" >{v.title}</a>
                  </p>
                  <p className="small muted">{v.channel} · {formatShortDate(v.publishedAt, lang)}</p>
                </li>
              ))}
            </ul>
            <p className="small muted">{T.videosNote}</p>
          </section>
        ) : null}
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
