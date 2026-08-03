import { getDailyNewsAsync } from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";
import { NewsSection } from "@/components/news/news-section";
import { TodayForYou } from "@/components/home/today-for-you";
import type { Locale } from "@/i18n/routing";

/**
 * Server: frische Headlines + Brief für die UI-Sprache.
 */
export async function HomeNewsBlock({ locale }: { locale: string }) {
  const loc: Locale =
    locale === "en" || locale === "hr" ? locale : "de";

  let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
  let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
  try {
    const data = await getDashboardData();
    matches = data.matches;
    players = data.players;
  } catch {
    /* brief + editorial still ok */
  }

  const articles = await getDailyNewsAsync(
    new Date(),
    { matches, players },
    loc
  );

  // Top: Redaktion, dann Headline in UI-Sprache, dann Brief
  const top =
    articles.find((a) => a.id.startsWith("editorial-slot-")) ||
    articles.find(
      (a) => a.isExternal && a.sourceUrl && a.sourceLang === loc
    ) ||
    articles.find((a) => a.id.startsWith("daily-brief-")) ||
    articles.find((a) => a.isExternal && a.sourceUrl) ||
    articles[0] ||
    null;

  return (
    <>
      <TodayForYou topHeadline={top} />
      <NewsSection initialArticles={articles} />
    </>
  );
}
