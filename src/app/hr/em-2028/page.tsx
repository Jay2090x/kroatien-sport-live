import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { Em2028View } from "@/views/em2028";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const f = fan("hr").euro;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/em-2028", "hr", f.metaTitle, f.metaDesc),
};

export default function Em2028PageHr() {
  return <Em2028View lang="hr" />;
}
