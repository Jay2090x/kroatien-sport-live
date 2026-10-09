import type { Metadata } from "next";
import { SportView } from "@/views/sport";
import { dict } from "@/lib/i18n";

export const revalidate = 60;
export const maxDuration = 60;

const t = dict("hr");
export const metadata: Metadata = {
  title: t.sport.metaTitle,
  description: t.sport.metaDesc,
  alternates: { canonical: "/hr/sport", languages: { de: "/sport", hr: "/hr/sport" } },
  openGraph: { locale: "hr_HR" },
};

export default function SportPageHr() {
  return <SportView lang="hr" />;
}
