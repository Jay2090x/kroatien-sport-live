import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Nutzungshinweise", alternates: { canonical: "/nutzung" } };

export default function NutzungPage() {
  return (
    <LegalPage title="Nutzungshinweise">
      <h2>Art des Angebots</h2>
      <p>
        {SITE.name} ist ein privates Informationsangebot zu Länderspielen der kroatischen Nationalmannschaft, zur
        SuperSport HNL und zu Fußball-Schlagzeilen. Es ist kein offizieller Auftritt eines Verbands oder Vereins.
      </p>
      <h2>Daten</h2>
      <p>
        Termine, Ergebnisse und Tabellen stammen automatisiert aus frei zugänglichen Quellen (ESPN, TheSportsDB,
        OpenLigaDB). Sie können verspätet, unvollständig oder fehlerhaft sein – alle Angaben ohne Gewähr. Maßgeblich
        sind die offiziellen Angaben von HNS, HNL und UEFA.
      </p>
      <h2>Externe Links</h2>
      <p>
        Schlagzeilen werden nur als Titel mit Quelle, Zeitpunkt und Link angezeigt. Für Inhalte und Verfügbarkeit der
        verlinkten Seiten sind ausschließlich deren Anbieter verantwortlich.
      </p>
      <h2>Haftung</h2>
      <p>Soweit gesetzlich zulässig, haften wir nicht für Schäden aus der Nutzung der Website oder externer Angebote.</p>
    </LegalPage>
  );
}
