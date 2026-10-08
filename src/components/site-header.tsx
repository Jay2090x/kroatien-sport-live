import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader({
  withNav = true,
  current,
}: {
  withNav?: boolean;
  current?: "spieler";
}) {
  return (
    <header className="site-header">
      <div className="flagband" aria-hidden="true" />
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="checker" aria-hidden="true" />
          <span>
            <span className="brand-name">{SITE.name}</span>
            <span className="brand-tag">{SITE.tagline}</span>
          </span>
        </Link>
        {withNav && (
          <nav aria-label="Abschnitte" className="nav">
            <Link href="/#vatreni">Vatreni</Link>
            <Link href="/spieler" aria-current={current === "spieler" ? "page" : undefined}>
              Spieler
            </Link>
            <Link href="/#hnl">HNL</Link>
            <Link href="/#news">News</Link>
          </nav>
        )}
      </div>
    </header>
  );
}
