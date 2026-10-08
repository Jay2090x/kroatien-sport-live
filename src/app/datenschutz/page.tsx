import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Datenschutz", alternates: { canonical: "/datenschutz" } };

export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <p>
        Wir nehmen den Schutz personenbezogener Daten ernst. Diese Erklärung beschreibt, welche Daten beim Besuch
        dieser Website anfallen können.
      </p>
      <h2>Verantwortlich</h2>
      <p>
        {SITE.name}
        <br />
        <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>
      </p>
      <h2>Welche Daten fallen an?</h2>
      <ul>
        <li>
          Technische Server-/Hosting-Logs beim Hoster Vercel (z. B. IP-Adresse, Zeitpunkt, User-Agent) zur
          Betriebssicherheit und Fehleranalyse.
        </li>
        <li>
          Vercel Web Analytics: anonymisierte Seitenaufrufe ohne Cookies und ohne personenbezogene Auswertung. Zweck:
          Reichweite messen.
        </li>
        <li>
          Keine Cookies, keine Konten, keine Push-Benachrichtigungen, keine Einbettung externer Bilder oder Videos.
          Spieldaten und Schlagzeilen werden serverseitig abgerufen – dein Browser kontaktiert dafür keine Dritten.
        </li>
        <li>
          Beim Klick auf externe Links (z. B. HRT, Google News, Nachrichtenmedien) gelten die Datenschutzbestimmungen
          der jeweiligen Anbieter.
        </li>
      </ul>
      <h2>Werbung</h2>
      <p>Derzeit keine Werbung und keine Affiliate-Links.</p>
      <h2>Deine Rechte</h2>
      <p>
        Je nach anwendbarem Recht (z. B. DSGVO) hast du Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung,
        Widerspruch und Beschwerde bei einer Aufsichtsbehörde. Anfragen an die oben genannte E-Mail-Adresse.
      </p>
      <p className="muted">Stand: Oktober 2026.</p>
    </LegalPage>
  );
}
