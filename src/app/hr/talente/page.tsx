import type { Metadata } from "next";
import { TalenteView } from "@/views/talente";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 60;

const f = fan("hr").talents;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  alternates: { canonical: "/hr/talente", languages: { de: "/talente", hr: "/hr/talente" } },
  openGraph: { locale: "hr_HR" },
};

export default function TalentePageHr() {
  return <TalenteView lang="hr" />;
}
