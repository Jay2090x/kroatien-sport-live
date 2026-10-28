import type { Metadata } from "next";
import { GameView, loadGame } from "@/views/game";
import { gameT } from "@/lib/game-i18n";
import { dataLabel } from "@/lib/i18n";
import { gamePath } from "@/lib/sources/game";
import { seo } from "@/lib/seo";

export const revalidate = 20;
export const maxDuration = 30;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ liga: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { liga, id } = await params;
  const T = gameT("de");
  const g = await loadGame(liga, id);
  if (!g) return { title: T.notFound, robots: { index: false } };
  const nm = (n: string) => (g.sport === "nba" ? n : dataLabel(n, "de"));
  const h = nm(g.home.name);
  const a = nm(g.away.name);
  const title = T.metaTitle(h, a);
  const desc = T.metaDesc(h, a, dataLabel(g.competition, "de"));
  const score = g.home.score != null && g.away.score != null ? `${h} ${g.home.score}:${g.away.score} ${a}` : `${h} – ${a}`;
  return {
    title,
    description: desc,
    ...seo(gamePath(liga, id), "de", title, desc, { title: score, sub: dataLabel(g.competition, "de") }),
    robots: { index: false, follow: true },
  };
}

export default async function GamePage({ params }: Props) {
  const { liga, id } = await params;
  return <GameView league={liga} id={id} lang="de" />;
}
