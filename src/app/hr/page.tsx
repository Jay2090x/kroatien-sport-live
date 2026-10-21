import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { HomeView } from "@/views/home";
import { SITE } from "@/lib/site";

export const revalidate = 60;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} – Vatreni, SuperSport HNL i vijesti` },
  description:
    "Sljedeća utakmica reprezentacije, rezultati Vatrenih, tablica SuperSport HNL-a, MMA, boks, tenis, košarka, rukomet i vijesti – automatski osvježavano.",
  ...seo("/", "hr", `${SITE.name} – Vatreni, SuperSport HNL i vijesti`, "Sljedeća utakmica reprezentacije, rezultati Vatrenih, tablica SuperSport HNL-a, MMA, boks, tenis, košarka, rukomet i vijesti – automatski osvježavano.", { title: SITE.name, sub: "Vatreni · SuperSport HNL · Igrači · Live ticker" }),
};

export default function HomePageHr() {
  return <HomeView lang="hr" />;
}
