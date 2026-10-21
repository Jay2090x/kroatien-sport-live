import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { KalenderView } from "@/views/kalender";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const f = fan("de").calendar;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/kalender", "de", f.metaTitle, f.metaDesc),
};

export default function KalenderPage() {
  return <KalenderView lang="de" />;
}
