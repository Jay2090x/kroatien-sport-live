import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/share/share-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { getDashboardData } from "@/lib/data/service";
import {
  getPlayerProfile,
  buildMinimalProfile,
} from "@/lib/data/player-profiles";
import {
  getAvailabilityLabel,
  getAvailabilityMeta,
  isExpectedToPlay,
} from "@/lib/player-availability";
import { SITE } from "@/lib/constants";
import { formatKickoff, isLiveStatus } from "@/lib/utils";
import { localizeTeamName } from "@/lib/team-names";
import type { Locale } from "@/i18n/routing";
import type { LocaleText } from "@/types/player-profile";
import { ArrowLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 60;

function tLoc(text: LocaleText, locale: string): string {
  const l = (
    locale === "hr" || locale === "en" || locale === "de" ? locale : "de"
  ) as Locale;
  return text[l] || text.de;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  try {
    const data = await getDashboardData();
    const player = data.players.find((p) => p.id === id);
    if (!player) return { title: "Player" };
    const title = `${player.name} · ${player.club}`;
    const description = `${player.positionLabel} · ${player.leagueName}`;
    const path = locale === "de" ? `/player/${id}` : `/${locale}/player/${id}`;
    return {
      title,
      description,
      alternates: {
        canonical: `${SITE.url}${path}`,
        languages: {
          de: `${SITE.url}/player/${id}`,
          en: `${SITE.url}/en/player/${id}`,
          hr: `${SITE.url}/hr/player/${id}`,
        },
      },
      openGraph: {
        type: "profile",
        title,
        description,
        url: `${SITE.url}${path}`,
        images: player.imageUrl ? [{ url: player.imageUrl }] : undefined,
      },
      twitter: { card: "summary", title, description },
    };
  } catch {
    return { title: "Player" };
  }
}

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("PlayerDetail");
  const tPlayers = await getTranslations("Players");
  const tMatch = await getTranslations("Match");

  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await getDashboardData();
  } catch {
    notFound();
  }

  const player = data.players.find((p) => p.id === id);
  if (!player) notFound();

  const profile =
    getPlayerProfile(player.id) ??
    buildMinimalProfile(player.id, player.name, player.club);
  const meta = getAvailabilityMeta(player.availability);
  const statusLabel = getAvailabilityLabel(player.availability, locale);
  const playing = isExpectedToPlay(player.availability);
  const sharePath =
    locale === "de" ? `/player/${id}` : `/${locale}/player/${id}`;

  const upcoming = data.matches
    .filter(
      (m) =>
        m.croatianPlayers.some((p) => p.playerId === player.id) &&
        m.status !== "finished" &&
        m.status !== "cancelled"
    )
    .sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    )
    .slice(0, 5);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-3 py-6 sm:px-6 sm:py-8">
        <nav className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/#players"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {tPlayers("title")}
          </Link>
          <div className="flex items-center gap-1.5">
            <FavoriteButton
              playerId={player.id}
              playerName={player.name}
              size="md"
              stopPropagation={false}
            />
            <ShareButton
              title={player.name}
              text={`${player.name} · ${player.club}`}
              url={sharePath}
            />
          </div>
        </nav>

        <div className="flex gap-3">
          <div
            className={cn(
              "relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 border-border bg-secondary sm:h-28 sm:w-24",
              !playing && "border-sky-500/40 grayscale-[25%]"
            )}
          >
            {player.imageUrl ? (
              <Image
                src={player.imageUrl}
                alt={player.name}
                fill
                className="object-contain object-bottom p-1"
                unoptimized
              />
            ) : (
              <User className="absolute inset-0 m-auto h-10 w-10 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight">{player.name}</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold",
                  meta.badgeClass
                )}
              >
                {meta.emoji} {statusLabel}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {player.leagueName}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {tLoc(profile.bio, locale)}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
              <span className="text-muted-foreground">{t("club")}</span>
              <span className="truncate font-medium">{player.club}</span>
              <span className="text-muted-foreground">{t("position")}</span>
              <span className="font-medium">
                {player.positionLabel} ({player.position})
              </span>
            </div>
          </div>
        </div>

        {upcoming.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {t("next")}
            </h2>
            <ul className="space-y-1.5">
              {upcoming.map((m) => {
                const live = isLiveStatus(m.status);
                return (
                  <li key={m.id}>
                    <Link
                      href={`/match/${m.id}`}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-secondary/50"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {localizeTeamName(m.homeTeam, locale)} –{" "}
                        {localizeTeamName(m.awayTeam, locale)}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {live
                          ? tMatch("live")
                          : formatKickoff(m.kickoff, "d.M. HH:mm", locale)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {upcoming.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">
            {tPlayers("noMatches")}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
