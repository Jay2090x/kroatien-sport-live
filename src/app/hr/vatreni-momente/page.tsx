import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { MomenteView } from "@/views/momente";
import { vhist } from "@/lib/vatreni-history-i18n";

export const revalidate = 86400;

const T = vhist("hr").m;
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/vatreni-momente", "hr", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <MomenteView lang="hr" />;
}
