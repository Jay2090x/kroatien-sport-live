import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { HomeView } from "@/views/home";

/**
 * ISR: höchstens jede Minute neu gerendert. Quellen haben eigene Cache-Intervalle
 * (10 min Standard, 60 s rund um Kroatien-Anpfiff, News 5 min, HNL 1 h) – siehe cache.ts.
 */
export const revalidate = 60;
export const maxDuration = 60;

export const metadata: Metadata = {
  ...seo("/", "de", `${SITE.name} – Vatreni, SuperSport HNL & News`, SITE.description, { title: SITE.name, sub: "Vatreni · SuperSport HNL · Spieler · Live-Ticker" }),
};

export default function HomePage() {
  return <HomeView lang="de" />;
}
