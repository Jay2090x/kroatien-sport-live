import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { SportView } from "@/views/sport";
import { dict } from "@/lib/i18n";

/** ISR jede Minute; Quellen 1 h gecacht (10 min rund um Termine), siehe sport.ts. */
export const revalidate = 60;
export const maxDuration = 60;

const t = dict("de");
export const metadata: Metadata = {
  title: t.sport.metaTitle,
  description: t.sport.metaDesc,
  ...seo("/sport", "de", t.sport.metaTitle, t.sport.metaDesc),
};

export default function SportPage() {
  return <SportView lang="de" />;
}
