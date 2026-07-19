import { setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/layout/hero";
import { Footer } from "@/components/layout/footer";
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

  return (
    <>
      <a
        href="#dashboard"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Zum Inhalt springen
      </a>

      <Navbar />
      <main>
        <Hero />
        <div className="mx-auto max-w-7xl space-y-8 px-3 py-5 sm:space-y-10 sm:px-6 sm:py-6 lg:px-8">
          <NationalTeamSection />
          <NewsSection />
          <MatchDashboard />
          <PlayerTracker />
          <TvSection />
          <ComingSoonSports />
        </div>
      </main>
      <Footer />
      <SettingsModal />
      <PlayerDetailPanel />
    </>
  );
}
