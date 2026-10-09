import type { Metadata } from "next";
import { HomeView } from "@/views/home";

/**
 * ISR: höchstens jede Minute neu gerendert. Quellen haben eigene Cache-Intervalle
 * (10 min Standard, 60 s rund um Kroatien-Anpfiff, News 5 min, HNL 1 h) – siehe cache.ts.
 */
export const revalidate = 60;
export const maxDuration = 60;

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { de: "/", hr: "/hr" } },
};

export default function HomePage() {
  return <HomeView lang="de" />;
}
