import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { InnovativView } from "@/views/innovativ";
import { inno } from "@/lib/innovation-i18n";

export const revalidate = 1800;
export const maxDuration = 30;

const T = inno("hr");
export const metadata: Metadata = {
  title: T.metaTitle,
  description: T.metaDesc,
  ...seo("/kroatien-innovativ", "hr", T.metaTitle, T.metaDesc),
};

export default function Page() {
  return <InnovativView lang="hr" />;
}
