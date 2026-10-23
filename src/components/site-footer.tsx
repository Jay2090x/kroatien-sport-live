import Link from "next/link";
import { dict, href, type Lang } from "@/lib/i18n";

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
          <a href="https://www.hnl.hr/supersport-hnl/raspored-i-rezultati/" rel="noopener" target="_blank">HNL.hr</a>{" "}
          {de ? "(offizielle HNL-Anstoßzeiten)" : "(službeni termini HNL-a)"} ·{" "}
          <a href="https://www.eurohandball.com/" rel="noopener" target="_blank">EHF</a> ·{" "}
          <a href="https://www.openligadb.de/" rel="noopener" target="_blank">OpenLigaDB</a> ·{" "}
          <a href="https://en.wikipedia.org/" rel="noopener" target="_blank">Wikipedia</a>{" "}
          {de ? "(Boxen-Abgleich, HNL-Tabellenabgleich," : "(provjera boksa i HNL tablice,"}{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" rel="noopener license" target="_blank">CC BY-SA 4.0</a>) ·{" "}
          <a href="https://sport.hrt.hr/" rel="noopener" target="_blank">HRT Sport</a>{" "}
          {de ? "und Google News (Schlagzeilen, Links zum Original)" : "i Google News (naslovi, poveznice na izvor)"} ·{" "}
          {de ? "Videos: offizielle YouTube-Kanäle von HNS, MAXSport, GNK Dinamo, HNK Hajduk, HNK Rijeka, NK Osijek und UFC" : "Videozapisi: službeni YouTube kanali HNS-a, MAXSporta, GNK Dinamo, HNK Hajduk, HNK Rijeka, NK Osijek i UFC-a"} ·{" "}
          {de ? "Spielerfotos: " : "Fotografije igrača: "}
          <a href="https://commons.wikimedia.org/" rel="noopener" target="_blank">Wikimedia Commons</a>{" "}
          {de ? "(freie Lizenzen, " : "(slobodne licence, "}
          <Link href={href(lang, "/bildnachweise")}>{de ? "Bildnachweise" : "izvori fotografija"}</Link>).
        </p>
        <p className="disclaimer">{t.footer.disclaimer}</p>
        <p className="disclaimer">
          {de ? "Anonyme, cookielose Besucherstatistik (Vercel Web Analytics)." : "Anonimna statistika posjeta bez kolačića (Vercel Web Analytics)."}
        </p>
        <nav className="legal" aria-label={t.footer.legal}>
          <Link href="/impressum">{t.footer.imprint}</Link>
          <Link href="/datenschutz">{t.footer.privacy}</Link>
          <Link href="/nutzung">{t.footer.terms}</Link>
          <Link href={href(lang, "/bildnachweise")}>{de ? "Bildnachweise" : "Izvori fotografija"}</Link>
        </nav>
      </div>
    </footer>
  );
}
