import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { KulturView } from "@/views/kultur";
import { kultur } from "@/lib/culture-i18n";

export const revalidate = 1800;
export const maxDuration = 30;

const T = kultur("de");
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/kroatien-kultur", "de", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <KulturView lang="de" />;
}
