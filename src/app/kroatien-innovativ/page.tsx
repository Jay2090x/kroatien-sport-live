import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { InnovativView } from "@/views/innovativ";
import { inno } from "@/lib/innovation-i18n";

export const revalidate = 1800;
export const maxDuration = 30;

const T = inno("de");
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/kroatien-innovativ", "de", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <InnovativView lang="de" />;
}
