import type { Metadata } from "next";
import { LiveView } from "@/views/live";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 60;
export const maxDuration = 30;

const f = fan("hr").live;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  alternates: { canonical: "/hr/live", languages: { de: "/live", hr: "/hr/live" } },
  openGraph: { locale: "hr_HR" },
};

export default function LivePageHr() {
  return <LiveView lang="hr" />;
}
