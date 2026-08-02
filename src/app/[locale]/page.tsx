import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { LiveMatchBoard } from "@/components/guide/live-match-board";
import { MyWeek } from "@/components/favorites/my-week";
import { NationalTeamSection } from "@/components/national-team/national-team-section";
import { NewsSection } from "@/components/news/news-section";
import { PlayerTracker } from "@/components/players/player-tracker";
import { SettingsModal } from "@/components/settings/settings-modal";
import { PlayerDetailPanel } from "@/components/players/player-detail-panel";
import { LegalStreamsStrip } from "@/components/tv/legal-streams-strip";
import { ComingSoonSports } from "@/components/sports/coming-soon-sports";

/**
 * Value hub (rechtlich konservativ):
 * 1) Live / Heute / 48h / 7d + Transparenz
 * 2) Meine Woche (Favoriten + ICS)
 * 3) Nationalteam (Kontext)
 * 4) News must-read + ticker
 * 5) Spieler-Tracker + Form
 * 6) Legal TV + Mehr
 */
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
        href="#live-board"
        className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("skipToContent")}
      </a>

      <Navbar />
      <main className="pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl space-y-10 px-3 py-5 sm:space-y-12 sm:px-6 sm:py-7 lg:px-8">
          <div id="live-board" className="scroll-mt-16">
            <LiveMatchBoard />
          </div>

          <MyWeek />

          <NationalTeamSection />

          <NewsSection />

          <div id="players-wrap" className="space-y-8">
            <PlayerTracker />
          </div>

          <LegalStreamsStrip />

          <div id="more" className="scroll-mt-16 space-y-6">
            <ComingSoonSports />
          </div>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      <SettingsModal />
      <PlayerDetailPanel />
    </>
  );
}
