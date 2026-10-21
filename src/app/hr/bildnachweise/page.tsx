import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { BildnachweiseView } from "@/views/bildnachweise";

export const metadata: Metadata = {
  title: "Izvori fotografija",
  description: "Izvori, autori i licence fotografija igrača (Wikimedia Commons).",
  ...seo("/bildnachweise", "hr", "Izvori fotografija", "Izvori, autori i licence fotografija igrača (Wikimedia Commons)."),
};

export default function BildnachweisePageHr() {
  return <BildnachweiseView lang="hr" />;
}
