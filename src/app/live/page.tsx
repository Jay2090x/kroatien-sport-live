import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { LiveView } from "@/views/live";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 60;
export const maxDuration = 30;

const f = fan("de").live;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/live", "de", f.metaTitle, f.metaDesc),
};

export default function LivePage() {
  return <LiveView lang="de" />;
}
