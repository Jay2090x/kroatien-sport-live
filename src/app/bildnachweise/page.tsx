import type { Metadata } from "next";
import { seo } from "@/lib/seo";
import { BildnachweiseView } from "@/views/bildnachweise";

export const metadata: Metadata = {
  title: "Bildnachweise",
  description: "Quellen, Urheber und Lizenzen der Spielerfotos (Wikimedia Commons).",
  ...seo("/bildnachweise", "de", "Bildnachweise", "Quellen, Urheber und Lizenzen der Spielerfotos (Wikimedia Commons)."),
};

export default function BildnachweisePage() {
  return <BildnachweiseView lang="de" />;
}
