import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { LiveView } from "@/views/live";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 60;
export const maxDuration = 30;

const f = fan("hr").live;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/live", "hr", f.metaTitle, f.metaDesc),
};

export default function LivePageHr() {
  return <LiveView lang="hr" />;
}
