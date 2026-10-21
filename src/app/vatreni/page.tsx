import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { VatreniListView } from "@/views/vatreni-list";
import { x2 } from "@/lib/fan/i18n2";

export const revalidate = 600;
export const maxDuration = 30;

const X = x2("de").match;
export const metadata: Metadata = {
  title: X.list,
  description: X.listIntro,
  ...seo("/vatreni", "de", X.list, X.listIntro),
};

export default function VatreniListDe() {
  return <VatreniListView lang="de" />;
}
