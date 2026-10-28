import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { ZahlenView } from "@/views/zahlen";
import { vhist } from "@/lib/vatreni-history-i18n";

export const revalidate = 86400;

const T = vhist("de").z;
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/kroatien-in-zahlen", "de", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <ZahlenView lang="de" />;
}
