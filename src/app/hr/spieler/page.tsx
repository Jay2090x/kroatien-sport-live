import type { Metadata } from "next";
import { SpielerView } from "@/views/spieler";
import { dict } from "@/lib/i18n";

export const revalidate = 60;
export const maxDuration = 60;

const t = dict("hr");
export const metadata: Metadata = {
  title: t.players.metaTitle,
  description: t.players.metaDesc,
  alternates: { canonical: "/hr/spieler", languages: { de: "/spieler", hr: "/hr/spieler" } },
  openGraph: { locale: "hr_HR" },
};

export default function SpielerPageHr() {
  return <SpielerView lang="hr" />;
}
