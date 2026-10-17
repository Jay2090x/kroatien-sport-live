import type { Metadata } from "next";
import { BildnachweiseView } from "@/views/bildnachweise";

export const metadata: Metadata = {
  title: "Izvori fotografija",
  description: "Izvori, autori i licence fotografija igrača (Wikimedia Commons).",
  alternates: { canonical: "/hr/bildnachweise", languages: { de: "/bildnachweise", hr: "/hr/bildnachweise" } },
  openGraph: { locale: "hr_HR" },
};

export default function BildnachweisePageHr() {
  return <BildnachweiseView lang="hr" />;
}
