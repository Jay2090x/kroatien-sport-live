import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { BilanzView } from "@/views/bilanz";
import { h2hT } from "@/lib/h2h-i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const T = h2hT("de");
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/bilanz", "de", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <BilanzView lang="de" />;
}
