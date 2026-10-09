import type { Metadata } from "next";
import { HomeView } from "@/views/home";
import { SITE } from "@/lib/site";

export const revalidate = 60;
export const maxDuration = 60;

export const metadata: Metadata = {
  title: { absolute: `${SITE.name} – Vatreni, SuperSport HNL i vijesti` },
  description:
    "Sljedeća utakmica reprezentacije, rezultati Vatrenih, tablica SuperSport HNL-a, MMA, boks, tenis, košarka, rukomet i vijesti – automatski osvježavano.",
  alternates: { canonical: "/hr", languages: { de: "/", hr: "/hr" } },
  openGraph: { locale: "hr_HR" },
};

export default function HomePageHr() {
  return <HomeView lang="hr" />;
}
