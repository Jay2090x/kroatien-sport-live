import Link from "next/link";
import { SITE } from "@/lib/site";
import { dict, href, type Lang } from "@/lib/i18n";
import { LangSwitch } from "./lang-switch";
import { fan } from "@/lib/fan/i18n";
import { LiveBar } from "./live-bar";
import { inno } from "@/lib/innovation-i18n";
import { kultur } from "@/lib/culture-i18n";
import { vhist } from "@/lib/vatreni-history-i18n";

export function SiteHeader({
  withNav = true,
  current,
  lang = "de",
  path = "/",
}: {
  withNav?: boolean;
  current?: "spieler" | "sport" | "legionaere" | "innovativ";
  lang?: Lang;
  /** aktuelle Seite ohne Sprachpräfix, z. B. "/sport" – für den Sprachwechsel */
  path?: string;
}) {
  const t = dict(lang);
  return (
    <>
    <LiveBar lang={lang} />
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
              <Link href={href(lang, "/vatreni-momente")} aria-current={path === "/vatreni-momente" ? "page" : undefined}>
                {vhist(lang).nav}
              </Link>
              <Link href={href(lang, "/kroatien-in-zahlen")} aria-current={path === "/kroatien-in-zahlen" ? "page" : undefined}>
                {vhist(lang).navZ}
              </Link>
              <Link href={href(lang, "/spieler")} aria-current={current === "spieler" ? "page" : undefined}>
                {t.nav.players}
              </Link>
              <Link href={href(lang, "/legionaere")} aria-current={current === "legionaere" ? "page" : undefined}>
                {fan(lang).nav.abroad}
              </Link>
              <Link href={href(lang, "/#hnl")}>{t.nav.hnl}</Link>
              <Link href={href(lang, "/#feed")}>{t.nav.news}</Link>
              <Link href={href(lang, "/sport")} aria-current={current === "sport" ? "page" : undefined}>
                {t.nav.sport}
              </Link>
              <Link href={href(lang, "/kroatien-innovativ")} aria-current={path === "/kroatien-innovativ" ? "page" : undefined}>
                {inno(lang).nav}
              </Link>
              <Link href={href(lang, "/kroatien-kultur")} aria-current={path === "/kroatien-kultur" ? "page" : undefined}>
                {kultur(lang).nav}
              </Link>
              <Link href={href(lang, "/#extras")}>{fan(lang).nav.extras}</Link>
            </nav>
          )}
          <LangSwitch lang={lang} paths={{ de: href("de", path), hr: href("hr", path) }} label={t.langLabel} />
        </div>
      </div>
    </header>
    </>
  );
}
