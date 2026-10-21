import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { Em2028View } from "@/views/em2028";
import { fan } from "@/lib/fan/i18n";

export const revalidate = 3600;
export const maxDuration = 30;

const f = fan("de").euro;
export const metadata: Metadata = {
  title: f.metaTitle,
  description: f.metaDesc,
  ...seo("/em-2028", "de", f.metaTitle, f.metaDesc),
};

export default function Em2028Page() {
  return <Em2028View lang="de" />;
}
