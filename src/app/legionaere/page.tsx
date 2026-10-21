import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { LegionaereView } from "@/views/legionaere";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 300;
export const maxDuration = 60;

const f = fan("de").abroad;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/legionaere", "de", f.metaTitle, f.metaDesc),
};

export default function LegionaerePage() {
  return <LegionaereView lang="de" />;
}
