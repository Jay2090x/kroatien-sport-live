import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { TeamView } from "@/views/team";
import { x2 } from "@/lib/fan/i18n2";

export const revalidate = 3600;
export const maxDuration = 60;

const X = x2("de").team.u21;
export const metadata: Metadata = {
  title: X.metaTitle,
  description: X.metaDesc,
  ...seo("/u21", "de", X.metaTitle, X.metaDesc),
};

export default function TeamPageDe() {
  return <TeamView team="u21" lang="de" />;
}
