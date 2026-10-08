import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader withNav={false} />
      <main className="container legal-page">
        <div className="card">
          <h1>Seite nicht gefunden</h1>
          <p>Diese Seite gibt es (nicht mehr).</p>
          <p>
            <Link href="/">← Zur Startseite</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
