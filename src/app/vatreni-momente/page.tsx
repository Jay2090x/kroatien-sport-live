import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { MomenteView } from "@/views/momente";
import { vhist } from "@/lib/vatreni-history-i18n";

export const revalidate = 86400;

const T = vhist("de").m;
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/vatreni-momente", "de", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <MomenteView lang="de" />;
}
