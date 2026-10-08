import Link from "next/link";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteHeader withNav={false} />
      <main className="container legal-page">
        <article className="card">
          <h1>{title}</h1>
          {children}
          <p>
            <Link href="/">← Zur Startseite</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
