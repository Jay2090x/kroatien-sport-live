import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { KalenderView } from "@/views/kalender";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const f = fan("hr").calendar;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/kalender", "hr", f.metaTitle, f.metaDesc),
};

export default function KalenderPageHr() {
  return <KalenderView lang="hr" />;
}
