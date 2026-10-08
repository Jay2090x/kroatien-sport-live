import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteHeader({ withNav = true }: { withNav?: boolean }) {
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
            <a href="#vatreni">Vatreni</a>
            <a href="#hnl">HNL</a>
            <a href="#news">News</a>
          </nav>
        )}
      </div>
    </header>
  );
}
