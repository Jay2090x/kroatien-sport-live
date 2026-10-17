import type { Metadata } from "next";
import { KalenderView } from "@/views/kalender";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const f = fan("hr").calendar;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  alternates: { canonical: "/hr/kalender", languages: { de: "/kalender", hr: "/hr/kalender" } },
  openGraph: { locale: "hr_HR" },
};

export default function KalenderPageHr() {
  return <KalenderView lang="hr" />;
}
