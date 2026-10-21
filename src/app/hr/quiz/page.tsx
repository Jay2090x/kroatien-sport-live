import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { QuizView } from "@/views/quiz";
import { x2 } from "@/lib/fan/i18n2";

const X = x2("hr").quiz;
export const metadata: Metadata = {
  title: X.metaTitle,
  description: X.metaDesc,
  ...seo("/quiz", "hr", X.metaTitle, X.metaDesc),
};

export default function QuizPageHr() {
  return <QuizView lang="hr" />;
}
