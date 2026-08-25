import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { HomeHero } from "@/components/layout/home-hero";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { ValueBoard } from "@/components/players/value-board";
import { LiveMatchBoard } from "@/components/guide/live-match-board";
import { HomeNewsBlock } from "@/components/news/home-news";
import { SettingsModal } from "@/components/settings/settings-modal";
import { PlayerDetailPanel } from "@/components/players/player-detail-panel";

/**
 * Schlanker Hub: Hero → Spieler (nächstes+letztes+Video) → Spiele → News
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
        href="#players"
        className="absolute left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0 focus-visible:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("skipToContent")}
      </a>

      <Navbar />
      <main className="pb-20 lg:pb-0">
        <div className="mx-auto max-w-7xl space-y-8 px-3 py-4 sm:space-y-10 sm:px-6 sm:py-6 lg:px-8">
          <HomeHero />

          <ValueBoard />

          <div id="live-board" className="scroll-mt-16">
            <LiveMatchBoard />
          </div>

          <Suspense
            fallback={
              <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
                {t("loading")}
              </div>
            }
          >
            <HomeNewsBlock locale={locale} />
          </Suspense>
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
      <SettingsModal />
      <PlayerDetailPanel />
    </>
  );
}
