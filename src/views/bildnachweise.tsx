import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Avatar } from "@/components/avatar";
import { allPhotos, PHOTOS_GENERATED } from "@/lib/photos";
import data from "@/data/photos.json";
import { href, type Lang } from "@/lib/i18n";
import { formatShortDate } from "@/lib/time";

const TXT = {
  de: {
    h1: "Bildnachweise",
    intro:
      "Alle Porträtfotos auf dieser Seite stammen von Wikimedia Commons und stehen unter freien Lizenzen (Creative Commons oder gemeinfrei). Die Zuordnung zur Person läuft über Wikidata (Bild-Eigenschaft der jeweiligen Person). Fotos von Agenturen, Vereinen oder anderen Sportportalen werden nicht verwendet.",
    changes:
      "Änderungen: Die Bilder wurden verkleinert und als runder Bildausschnitt dargestellt. Bearbeitungen von CC-BY-SA-Bildern stehen unter derselben Lizenz wie das Original.",
    photo: "Foto",
    license: "Lizenz",
    file: "Datei auf Wikimedia Commons",
    taken: "Aufnahme",
    cropped: "Ausschnitt, verkleinert",
    none: "Ohne freies Foto (Platzhalter mit Initialen)",
    noneIntro:
      "Für diese Personen gibt es derzeit kein passendes frei lizenziertes Bild. Sie erscheinen mit einem neutralen Platzhalter – es werden keine künstlich erzeugten Gesichter verwendet.",
    checked: "Stand der Prüfung",
    contact: "Fehler bei einem Bild oder einer Angabe? Bitte über das Impressum melden – das Bild wird dann umgehend entfernt.",
    back: "← Zur Startseite",
  },
  hr: {
    h1: "Izvori fotografija",
    intro:
      "Sve fotografije na ovoj stranici potječu s Wikimedia Commonsa i objavljene su pod slobodnim licencama (Creative Commons ili javno dobro). Povezivanje s osobom ide preko Wikidate (svojstvo slike pojedine osobe). Fotografije agencija, klubova ili drugih sportskih portala ne koriste se.",
    changes:
      "Izmjene: slike su smanjene i prikazane kao okrugli izrez. Prerade slika pod licencom CC BY-SA objavljene su pod istom licencom kao izvornik.",
    photo: "Fotografija",
    license: "Licenca",
    file: "Datoteka na Wikimedia Commonsu",
    taken: "Snimljeno",
    cropped: "izrezano, smanjeno",
    none: "Bez slobodne fotografije (oznaka s inicijalima)",
    noneIntro:
      "Za ove osobe trenutačno ne postoji prikladna slobodno licencirana fotografija. Prikazuju se s neutralnom oznakom – umjetno generirana lica se ne koriste.",
    checked: "Stanje provjere",
    contact: "Pogreška kod slike ili podatka? Javite nam se preko impressuma – slika će odmah biti uklonjena.",
    back: "← Na početnu stranicu",
  },
} as const;

function takenDate(d: string | null): string | null {
  const m = d?.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}.${m[2]}.${m[1]}`;
  const y = d?.match(/\b(19|20)\d{2}\b/);
  return y ? y[0] : null;
}

export function BildnachweiseView({ lang }: { lang: Lang }) {
  const T = TXT[lang];
  const photos = allPhotos();
  const none = Object.values(data.none as Record<string, { name: string }>)
    .map((n) => n.name)
    .sort((a, b) => a.split(" ").at(-1)!.localeCompare(b.split(" ").at(-1)!, "hr"));
  return (
    <>
      <SiteHeader lang={lang} path="/bildnachweise" />
      <main className="container legal-page">
        <article className="card">
          <h1>{T.h1}</h1>
          <p>{T.intro}</p>
          <p className="small">{T.changes}</p>
          <ul className="photo-credits">
            {photos.map((p) => {
              const taken = takenDate(p.date);
              return (
                <li key={p.key}>
                  <Avatar pkey={p.key} name={p.name} size={52} lang={lang} />
                  <div>
                    <span className="pc-name">{p.name}</span>
                    {T.photo}: {p.author} ·{" "}
                    {T.license}:{" "}
                    {p.licenseUrl ? (
                      <a href={p.licenseUrl} rel="noopener license" target="_blank">
                        {p.license}
                      </a>
                    ) : (
                      p.license
                    )}{" "}
                    · {T.cropped}
                    <br />
                    <a href={p.page} rel="noopener" target="_blank">
                      {T.file}: {p.file}
                    </a>
                    {taken ? <span className="muted"> · {T.taken}: {taken}</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <h2>{T.none}</h2>
          <p className="small">{T.noneIntro}</p>
          <p className="small">{none.join(", ")}</p>
          <p className="small muted">
            {T.checked}: {formatShortDate(PHOTOS_GENERATED, lang)} · {T.contact}
          </p>
          <p>
            <Link href={href(lang, "/")}>{T.back}</Link>
          </p>
        </article>
      </main>
      <SiteFooter lang={lang} />
    </>
  );
}
