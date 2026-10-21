import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { QuizView } from "@/views/quiz";
import { x2 } from "@/lib/fan/i18n2";

const X = x2("de").quiz;
export const metadata: Metadata = {
  title: X.metaTitle,
  description: X.metaDesc,
  ...seo("/quiz", "de", X.metaTitle, X.metaDesc),
};

export default function QuizPageDe() {
  return <QuizView lang="de" />;
}
