import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Impressum", alternates: { canonical: "/impressum" } };

export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <p>
        <strong>Anbieter / Diensteanbieter</strong>
        <br />
        {SITE.name}
        <br />
        Privates, redaktionelles Informationsangebot (Website).
      </p>
      <p>
        <strong>Kontakt</strong>
        <br />
        Kontaktaufnahme ausschließlich per E-Mail (keine Postanschrift im öffentlichen Impressum):
        <br />
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
      </p>
      <p>
        Dieses Angebot stellt Spieltermine, Ergebnisse und Tabellen aus frei zugänglichen Datenquellen sowie
        Schlagzeilen mit Link zur Originalquelle bereit. Es werden keine Übertragungen gehostet, keine Streams
        angeboten und keine Volltexte Dritter übernommen. Für verlinkte Inhalte sind ausschließlich die jeweiligen
        Anbieter verantwortlich.
      </p>
      <p className="muted">
        Hinweis: Aus Datenschutzgründen werden im öffentlichen Impressum keine privaten Wohnadressen oder Klarnamen
        natürlicher Personen veröffentlicht. Behörden und Anspruchsteller erhalten bei berechtigtem Interesse die
        erforderlichen Angaben auf Anfrage per E-Mail.
      </p>
    </LegalPage>
  );
}
