import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { SportView } from "@/views/sport";
import { dict } from "@/lib/i18n";

export const revalidate = 60;
export const maxDuration = 60;

const t = dict("hr");
export const metadata: Metadata = {
  title: t.sport.metaTitle,
  description: t.sport.metaDesc,
  ...seo("/sport", "hr", t.sport.metaTitle, t.sport.metaDesc),
};

export default function SportPageHr() {
  return <SportView lang="hr" />;
}
