import { getDailyNewsAsync } from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";
import { NewsSection } from "@/components/news/news-section";
import type { Locale } from "@/i18n/routing";

/**
 * Server: frische Headlines + Brief (ohne „Heute für dich“).
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

  return <NewsSection initialArticles={articles} />;
}
