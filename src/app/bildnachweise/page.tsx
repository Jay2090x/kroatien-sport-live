import type { Metadata } from "next";
import { BildnachweiseView } from "@/views/bildnachweise";

export const metadata: Metadata = {
  title: "Bildnachweise",
  description: "Quellen, Urheber und Lizenzen der Spielerfotos (Wikimedia Commons).",
  alternates: { canonical: "/bildnachweise", languages: { de: "/bildnachweise", hr: "/hr/bildnachweise" } },
};

export default function BildnachweisePage() {
  return <BildnachweiseView lang="de" />;
}
