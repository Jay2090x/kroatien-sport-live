import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VatreniSection } from "@/components/vatreni-section";
import { HnlSection } from "@/components/hnl-section";
import { NewsSection } from "@/components/news-section";
import { SportTeaser } from "@/components/sport-teaser";
import { getVatreni } from "@/lib/sources/vatreni";
import { getHnl } from "@/lib/sources/hnl";
import { getNews } from "@/lib/sources/news";
import { getSport } from "@/lib/sources/sport";

/**
 * ISR: Die Seite wird höchstens jede Minute neu gerendert. Die eigentlichen
 * Datenquellen haben eigene Cache-Intervalle (10 min Standard, 60 s rund um
 * einen Kroatien-Anpfiff, News 15 min, HNL 1 h) – siehe src/lib/cache.ts.
 */
export const revalidate = 60;
export const maxDuration = 60;

export default async function HomePage() {
  const [vatreni, hnl, news, sport] = await Promise.all([getVatreni(), getHnl(), getNews(), getSport()]);

  return (
    <>
      <SiteHeader />
      <main className="container grid">
        <VatreniSection data={vatreni} />
        <HnlSection hnl={hnl} />
        <SportTeaser data={sport} />
        <NewsSection news={news} />
      </main>
      <SiteFooter />
    </>
  );
}
