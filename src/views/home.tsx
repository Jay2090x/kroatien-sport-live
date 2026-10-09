import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VatreniSection } from "@/components/vatreni-section";
import { HnlSection } from "@/components/hnl-section";
import { FeedSection } from "@/components/feed-section";
import { NotFootballGate, SportFilterBar, SportGate } from "@/components/sport-filter";
import { TimelineList } from "@/components/timeline";
import { NewsList } from "@/components/news-list";
import { Highlights } from "@/components/highlights";
import { NoData, Stand } from "@/components/stand";
import { getVatreni } from "@/lib/sources/vatreni";
import { getHnl } from "@/lib/sources/hnl";
import { getNews, pickNews } from "@/lib/sources/news";
import { getSport } from "@/lib/sources/sport";
import { getBoxers } from "@/lib/sources/boxing";
import { getVideos, recentVideos } from "@/lib/sources/videos";
import { buildTimeline, tlLabels } from "@/lib/timeline";
import { buildFeed } from "@/lib/feed";
import { dict, href, type Lang } from "@/lib/i18n";
import { formatKickoff } from "@/lib/time";

/**
 * Startseite: Fußball zuerst (Vatreni + HNL, darunter der verknüpfte Fußball-Feed
 * aus Spielen, offiziellen Clips und Schlagzeilen), danach weitere Sportarten.
 */
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

  const MAX_CLIPS = 6;
  const feed =
    news || videos
      ? buildFeed(
          { vatreni, hnl: hnl?.data ?? null, news: news?.data ?? [], videos: videos?.data ?? [] },
          { lang, now, maxClips: MAX_CLIPS - 1, maxNews: 8 }
        )
      : null;
  const footballClips = feed?.entries.filter((e) => e.type === "story" && e.clip).length ?? 0;
  const feedFetchedAt = [news?.fetchedAt, videos?.fetchedAt].filter(Boolean).sort().at(-1) ?? null;

  // weitere Sportarten (ohne Fußball – der steht oben)
  const tl = buildTimeline({ vatreni, hnl, sport, boxers }, lang, now);
  const notFootball = <T extends { sport: string }>(xs: T[]) => xs.filter((x) => x.sport !== "football");
  const otherNews = news
    ? pickNews(notFootball(news.data), { lang, now, max: 6, min: 3, perSport: 2 }).map((n) => ({
        ...n,
        when: `${formatKickoff(n.publishedAt, lang)} ${t.oclock}`,
      }))
    : [];
  const otherClips = notFootball(recentVideos(videos?.data ?? [], now))
    .slice(0, Math.max(1, MAX_CLIPS - footballClips))
    .map((v) => ({ ...v, when: formatKickoff(v.publishedAt, lang) }));

  return (
    <>
      <SiteHeader lang={lang} path="/" />
      <main className="container grid">
        <div className="span-2 filter-row">
          <SportFilterBar t={{ filter: t.filter }} />
        </div>

        <SportGate sport="football">
          <VatreniSection data={vatreni} lang={lang} clipFor={feed?.clipFor} />
          <HnlSection hnl={hnl} lang={lang} clipFor={feed?.clipFor} />
          <FeedSection feed={feed} lang={lang} fetchedAt={feedFetchedAt} />
        </SportGate>

        <NotFootballGate>
          <section id="termine" className="card span-2 other-sports" aria-labelledby="tl-h">
            <div className="card-head">
              <h2 id="tl-h">🏅 {t.other.title}</h2>
              <span className="pill">{t.other.pill}</span>
            </div>
            {!sport ? (
              <NoData what={t.other.title} lang={lang} />
            ) : (
              <div className="other-cols">
                <div>
                  <h3>{t.other.upcoming}</h3>
                  <TimelineList items={notFootball(tl.upcoming)} t={tlLabels(t)} limit={5} empty={t.timeline.noneUpcoming} />
                  <h3>{t.other.results}</h3>
                  <TimelineList items={notFootball(tl.results)} t={tlLabels(t)} limit={4} empty={t.timeline.noneResults} />
                </div>
                <div>
                  <h3>{t.other.headlines}</h3>
                  {news ? <NewsList items={otherNews} tags={t.tags} empty={t.sport.noHeadlines} limit={6} /> : <NoData what={t.news.what} lang={lang} />}
                </div>
              </div>
            )}
            <p className="more-link">
              <Link href={href(lang, "/sport")}>{t.timeline.more}</Link>
            </p>
            <Stand fetchedAt={sport?.fetchedAt ?? null} source={t.timeline.sources} lang={lang} />
          </section>
          <Highlights id="clips-other" videos={otherClips} labels={{ ...t.highlights }} />
        </NotFootballGate>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
