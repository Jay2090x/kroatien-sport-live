import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { SpielerView } from "@/views/spieler";
import { dict } from "@/lib/i18n";

export const revalidate = 60;
export const maxDuration = 60;

const t = dict("hr");
export const metadata: Metadata = {
  title: t.players.metaTitle,
  description: t.players.metaDesc,
  ...seo("/spieler", "hr", t.players.metaTitle, t.players.metaDesc),
};

export default function SpielerPageHr() {
  return <SpielerView lang="hr" />;
}
