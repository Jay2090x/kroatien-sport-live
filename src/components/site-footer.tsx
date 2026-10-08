import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="credits">
          <strong>Datenquellen:</strong>{" "}
          <a href="https://www.espn.com/soccer/" rel="noopener" target="_blank">ESPN</a> (Länderspiele,
          Nations-League-Tabelle, Spielerdaten) ·{" "}
          <a href="https://www.thesportsdb.com/" rel="noopener" target="_blank">TheSportsDB</a> (SuperSport HNL) ·{" "}
          <a href="https://www.openligadb.de/" rel="noopener" target="_blank">OpenLigaDB</a> (Ersatzquelle Länderspiele) ·{" "}
          <a href="https://sport.hrt.hr/" rel="noopener" target="_blank">HRT Sport</a> und Google News (Schlagzeilen, Links
          zum Original) ·{" "}
          <a href="https://de.wikipedia.org/" rel="noopener" target="_blank">Wikipedia</a> (Abgleich der HNL-Tabelle,{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.de" rel="noopener license" target="_blank">CC BY-SA 4.0</a>).
        </p>
        <p className="disclaimer">
          Alle Angaben ohne Gewähr. Maßgeblich sind die offiziellen Angaben von HNS, HNL und UEFA. Alle Zeiten in
          Wiener Zeit (MEZ/MESZ). Kein offizielles Angebot eines Verbands oder Vereins.
        </p>
        <nav className="legal" aria-label="Rechtliches">
          <Link href="/impressum">Impressum</Link>
          <Link href="/datenschutz">Datenschutz</Link>
          <Link href="/nutzung">Nutzungshinweise</Link>
        </nav>
      </div>
    </footer>
  );
}
