import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/layout/hero";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MatchDashboard } from "@/components/matches/match-dashboard";
import { NationalTeamSection } from "@/components/national-team/national-team-section";
import { NewsSection } from "@/components/news/news-section";
import { PlayerTracker } from "@/components/players/player-tracker";
import { TvSection } from "@/components/tv/tv-section";
import { ComingSoonSports } from "@/components/sports/coming-soon-sports";
import { SettingsModal } from "@/components/settings/settings-modal";
import { PlayerDetailPanel } from "@/components/players/player-detail-panel";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Common");

  return (
    <>
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {t("skipToContent")}
      </a>

      <Navbar />
      <main className="pb-20 lg:pb-0">
        <Hero />
        <div className="mx-auto max-w-7xl space-y-7 px-3 py-5 sm:space-y-9 sm:px-6 sm:py-6 lg:px-8">
          <NationalTeamSection />
          <NewsSection />
          <MatchDashboard />
          <PlayerTracker />
          <TvSection />
          <ComingSoonSports />
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      <SettingsModal />
      <PlayerDetailPanel />
    </>
  );
}
