import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { MatchDetailBody } from "@/components/matches/match-detail-body";
import { getDashboardData } from "@/lib/data/service";
import { SITE } from "@/lib/constants";
import {
  localizeCompetitionLabel,
  localizeTeamName,
} from "@/lib/team-names";
import { scoreDisplay } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  try {
    const data = await getDashboardData();
    const match = data.matches.find((m) => m.id === id);
    if (!match) return { title: "Match" };
    const home = localizeTeamName(match.homeTeam, locale);
    const away = localizeTeamName(match.awayTeam, locale);
    const title = `${home} – ${away}`;
    const score = scoreDisplay(match.homeScore, match.awayScore);
    const description = `${localizeCompetitionLabel(match.leagueName, locale)} · ${score}`;
    const path = locale === "de" ? `/match/${id}` : `/${locale}/match/${id}`;
    return {
      title,
      description,
      alternates: {
        canonical: `${SITE.url}${path}`,
        languages: {
          de: `${SITE.url}/match/${id}`,
          en: `${SITE.url}/en/match/${id}`,
          hr: `${SITE.url}/hr/match/${id}`,
        },
      },
      openGraph: {
        type: "website",
        title,
        description,
        url: `${SITE.url}${path}`,
      },
      twitter: { card: "summary", title, description },
    };
  } catch {
    return { title: "Match" };
  }
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Match");

  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await getDashboardData();
  } catch {
    notFound();
  }

  const match = data.matches.find((m) => m.id === id);
  if (!match) notFound();

  const sharePath =
    locale === "de" ? `/match/${id}` : `/${locale}/match/${id}`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-3 py-6 sm:px-6 sm:py-8">
        <nav className="mb-5">
          <Link
            href="/#dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backMatches")}
          </Link>
        </nav>
        <MatchDetailBody
          match={match}
          players={data.players}
          sharePath={sharePath}
        />
      </main>
      <Footer />
    </>
  );
}
