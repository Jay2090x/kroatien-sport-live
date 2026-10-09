import Link from "next/link";
import { dict, type Lang } from "@/lib/i18n";

export function SiteFooter({ lang = "de" }: { lang?: Lang }) {
  const t = dict(lang);
  const de = lang === "de";
  return (
    <footer className="site-footer">
      <div className="container">
        <p className="credits">
          <strong>{t.footer.sources}:</strong>{" "}
          <a href="https://www.espn.com/soccer/" rel="noopener" target="_blank">ESPN</a>{" "}
          {de ? "(Länderspiele, Nations-League-Tabelle, Spielerdaten, MMA, Tennis, NBA)" : "(reprezentacija, Liga nacija, podaci o igračima, MMA, tenis, NBA)"} ·{" "}
          <a href="https://www.thesportsdb.com/" rel="noopener" target="_blank">TheSportsDB</a>{" "}
          {de ? "(SuperSport HNL, Handball-/Basketball-Termine)" : "(SuperSport HNL, rukometni/košarkaški termini)"} ·{" "}
          <a href="https://www.eurohandball.com/" rel="noopener" target="_blank">EHF</a> ·{" "}
          <a href="https://www.openligadb.de/" rel="noopener" target="_blank">OpenLigaDB</a> ·{" "}
          <a href="https://en.wikipedia.org/" rel="noopener" target="_blank">Wikipedia</a>{" "}
          {de ? "(Boxen-Abgleich, HNL-Tabellenabgleich," : "(provjera boksa i HNL tablice,"}{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener license" target="_blank">CC BY-SA 4.0</a>) ·{" "}
          <a href="https://sport.hrt.hr/" rel="noopener" target="_blank">HRT Sport</a>{" "}
          {de ? "und Google News (Schlagzeilen, Links zum Original)" : "i Google News (naslovi, poveznice na izvor)"} ·{" "}
          {de ? "Videos: offizielle YouTube-Kanäle von HNS, MAXSport, GNK Dinamo, HNK Hajduk, HNK Rijeka, NK Osijek und UFC" : "Videozapisi: službeni YouTube kanali HNS-a, MAXSporta, GNK Dinamo, HNK Hajduk, HNK Rijeka, NK Osijek i UFC-a"}.
        </p>
        <p className="disclaimer">{t.footer.disclaimer}</p>
        <nav className="legal" aria-label={t.footer.legal}>
          <Link href="/impressum">{t.footer.imprint}</Link>
          <Link href="/datenschutz">{t.footer.privacy}</Link>
          <Link href="/nutzung">{t.footer.terms}</Link>
        </nav>
      </div>
    </footer>
  );
}
