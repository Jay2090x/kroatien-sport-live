import { getDailyNewsAsync } from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";
import { NewsSection } from "@/components/news/news-section";
import { TodayForYou } from "@/components/home/today-for-you";

/**
 * Server: holt frische Headlines + Brief, übergibt an Client-UI.
 * Vermeidet leeren/alten Client-Fallback ohne RSS.
 */
export async function HomeNewsBlock() {
  let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
  let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
  try {
    const data = await getDashboardData();
    matches = data.matches;
    players = data.players;
  } catch {
    /* brief + editorial still ok */
  }

  const articles = await getDailyNewsAsync(new Date(), { matches, players });
  // Top story for „Heute für dich“: prefer external headline, else brief
  const top =
    articles.find((a) => a.id.startsWith("auto-") && a.sourceUrl) ||
    articles.find((a) => a.id.startsWith("daily-brief-")) ||
    articles[0] ||
    null;

  return (
    <>
      <TodayForYou topHeadline={top} />
      <NewsSection initialArticles={articles} />
    </>
  );
}
