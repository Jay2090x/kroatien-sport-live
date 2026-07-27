import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { LiveMatchBoard } from "@/components/guide/live-match-board";
import { MatchDashboard } from "@/components/matches/match-dashboard";
import { NationalTeamSection } from "@/components/national-team/national-team-section";
import { NewsSection } from "@/components/news/news-section";
import { PlayerTracker } from "@/components/players/player-tracker";
import { MyCroatians } from "@/components/favorites/my-croatians";
import { TvSection } from "@/components/tv/tv-section";
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
  const tGuide = await getTranslations("Guide");

  return (
    <>
      <a
        href="#live-board"
        className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("skipToContent")}
      </a>

      <Navbar />
      <main className="pb-20 lg:pb-0">
        {/* Primary: modern Live & TV guide board */}
        <div
          id="live-board"
          className="border-b border-border bg-gradient-to-b from-[color-mix(in_oklab,var(--croatia-blue)_14%,var(--background))] to-background"
        >
          <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
            <LiveMatchBoard />
          </div>
        </div>

        {/* Existing product depth below */}
        <div className="mx-auto max-w-7xl space-y-7 px-3 py-5 sm:space-y-9 sm:px-6 sm:py-6 lg:px-8">
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {tGuide("sectionMore")}
          </p>
          <NationalTeamSection />
          <MyCroatians />
          <NewsSection />
          <MatchDashboard />
          <PlayerTracker />
          <TvSection />
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      <SettingsModal />
      <PlayerDetailPanel />
    </>
  );
}
