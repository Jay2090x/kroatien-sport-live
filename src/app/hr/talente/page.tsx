import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { TalenteView } from "@/views/talente";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 60;

const f = fan("hr").talents;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/talente", "hr", f.metaTitle, f.metaDesc),
};

export default function TalentePageHr() {
  return <TalenteView lang="hr" />;
}
