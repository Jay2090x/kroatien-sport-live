import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VatreniSection } from "@/components/vatreni-section";
import { HnlSection } from "@/components/hnl-section";
import { SportFilterBar, SportGate } from "@/components/sport-filter";
import { TimelineList } from "@/components/timeline";
import { NewsList } from "@/components/news-list";
import { Highlights } from "@/components/highlights";
import { NoData, Stand } from "@/components/stand";
import { getVatreni } from "@/lib/sources/vatreni";
import { getHnl } from "@/lib/sources/hnl";
import { getNews, pickNews } from "@/lib/sources/news";
import { getSport } from "@/lib/sources/sport";
import { getBoxers } from "@/lib/sources/boxing";
import { getVideos } from "@/lib/sources/videos";
import { buildTimeline, tlLabels } from "@/lib/timeline";
import { dict, href, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";

export async function HomeView({ lang }: { lang: Lang }) {
  const t = dict(lang);
  const now = Date.now();
  const [vatreni, hnl, news, sport, boxers, videos] = await Promise.all([
    getVatreni(),
    getHnl(),
    getNews(),
    getSport(),
    getBoxers(),
    getVideos(),
  ]);
  const tl = buildTimeline({ vatreni, hnl, sport, boxers }, lang, now);
  const newsRows = news
    ? pickNews(news.data, { lang, now, max: 10, min: 6, perSport: 4 }).map((n) => ({ ...n, when: `${formatKickoff(n.publishedAt, lang)} ${t.oclock}` }))
    : [];
  const clips = (videos?.data ?? []).map((v) => ({ ...v, when: formatKickoff(v.publishedAt, lang) }));

  return (
    <>
      <SiteHeader lang={lang} path="/" />
      <main className="container grid">
        <div className="span-2 filter-row">
          <SportFilterBar t={{ filter: t.filter }} />
        </div>

        <SportGate sport="football">
          <VatreniSection data={vatreni} lang={lang} />
        </SportGate>

        <section id="termine" className="card" aria-labelledby="tl-h">
          <div className="card-head">
            <h2 id="tl-h">📅 {t.timeline.title}</h2>
          </div>
          {!sport && !hnl ? (
            <NoData what={t.timeline.title} lang={lang} />
          ) : (
            <>
              <h3>{t.timeline.upcoming}</h3>
              <TimelineList items={tl.upcoming} t={tlLabels(t)} limit={6} empty={t.timeline.noneUpcoming} />
              <h3>{t.timeline.results}</h3>
              <TimelineList items={tl.results} t={tlLabels(t)} limit={4} empty={t.timeline.noneResults} />
            </>
          )}
          <p className="more-link">
            <Link href={href(lang, "/sport")}>{t.timeline.more}</Link>
          </p>
          <Stand fetchedAt={sport?.fetchedAt ?? hnl?.fetchedAt ?? null} source={t.timeline.sources} lang={lang} />
        </section>

        <section id="news" className="card" aria-labelledby="news-h">
          <div className="card-head">
            <h2 id="news-h">📰 {t.news.title}</h2>
            <span className="pill">{t.news.pill}</span>
          </div>
          {!news ? (
            <NoData what={t.news.what} lang={lang} />
          ) : (
            <NewsList items={newsRows} tags={t.tags} empty={t.sport.noHeadlines} limit={8} />
          )}
          <p className="footnote">{t.news.note}</p>
          <Stand fetchedAt={news?.fetchedAt ?? null} source={t.news.sources} lang={lang} />
        </section>

        <SportGate sport="football">
          <HnlSection hnl={hnl} lang={lang} />
        </SportGate>

        <Highlights videos={clips.slice(0, 3)} labels={{ ...t.highlights }} />
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
