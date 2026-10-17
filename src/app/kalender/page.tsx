import type { Metadata } from "next";
import { KalenderView } from "@/views/kalender";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const f = fan("de").calendar;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  alternates: { canonical: "/kalender", languages: { de: "/kalender", hr: "/hr/kalender" } },

};

export default function KalenderPage() {
  return <KalenderView lang="de" />;
}
