import Link from "next/link";
import { SITE } from "@/lib/site";
import { dict, href, type Lang } from "@/lib/i18n";
import { LangSwitch } from "./lang-switch";

export function SiteHeader({
  withNav = true,
  current,
  lang = "de",
  path = "/",
}: {
  withNav?: boolean;
  current?: "spieler" | "sport";
  lang?: Lang;
  /** aktuelle Seite ohne Sprachpräfix, z. B. "/sport" – für den Sprachwechsel */
  path?: string;
}) {
  const t = dict(lang);
  return (
    <header className="site-header">
      <div className="flagband" aria-hidden="true" />
      <div className="container header-inner">
        <Link href={href(lang, "/")} className="brand">
          <span className="checker" aria-hidden="true" />
          <span>
            <span className="brand-name">{SITE.name}</span>
            <span className="brand-tag">{t.tagline}</span>
          </span>
        </Link>
        <div className="header-right">
          {withNav && (
            <nav aria-label={t.nav.sections} className="nav">
              <Link href={href(lang, "/#vatreni")}>{t.nav.vatreni}</Link>
              <Link href={href(lang, "/spieler")} aria-current={current === "spieler" ? "page" : undefined}>
                {t.nav.players}
              </Link>
              <Link href={href(lang, "/#hnl")}>{t.nav.hnl}</Link>
              <Link href={href(lang, "/#news")}>{t.nav.news}</Link>
              <Link href={href(lang, "/sport")} aria-current={current === "sport" ? "page" : undefined}>
                {t.nav.sport}
              </Link>
            </nav>
          )}
          <LangSwitch lang={lang} paths={{ de: href("de", path), hr: href("hr", path) }} label={t.langLabel} />
        </div>
      </div>
    </header>
  );
}
