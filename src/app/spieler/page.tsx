import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { SpielerView } from "@/views/spieler";
import { dict } from "@/lib/i18n";

/**
 * ISR jede Minute; die Quellen selbst sind 30 min gecacht (5 min rund um den
 * Anpfiff eines Spielers, abgeschlossene Spielberichte 24 h).
 */
export const revalidate = 60;
export const maxDuration = 60;

const t = dict("de");
export const metadata: Metadata = {
  title: t.players.metaTitle,
  description: t.players.metaDesc,
  ...seo("/spieler", "de", t.players.metaTitle, t.players.metaDesc),
};

export default function SpielerPage() {
  return <SpielerView lang="de" />;
}
