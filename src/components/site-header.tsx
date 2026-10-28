import Link from "next/link";
import { SITE } from "@/lib/site";
import { dict, href, type Lang } from "@/lib/i18n";
import { LangSwitch } from "./lang-switch";
import { LiveBar } from "./live-bar";
import { NavScroll } from "./nav-scroll";
import { NAV, isCurrent, itemActive } from "@/lib/nav";

export function SiteHeader({
  withNav = true,
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
            <nav aria-label={t.nav.sections} className="nav" id="site-nav">
              <NavScroll />
              {NAV.map((item) =>
                item.kind === "link" ? (
                  <Link
                    key={item.key}
                    href={href(lang, item.link.path)}
                    className={`nav-top${isCurrent(item.link, path) ? " on" : ""}`}
                    aria-current={isCurrent(item.link, path) ? "page" : undefined}
                  >
                    {item.link.label[lang]}
                  </Link>
                ) : (
                  <details key={item.key} className="nav-menu" data-menu={item.key}>
                    <summary className={`nav-top${itemActive(item, path) ? " on" : ""}`}>
                      {item.label[lang]}
                      <span className="caret" aria-hidden="true" />
                    </summary>
                    <div className="nav-panel">
                      {item.groups.map((g) => (
                        <div key={g.title.de} className="nav-group">
                          {item.groups.length > 1 && <p className="nav-gtitle">{g.title[lang]}</p>}
                          <ul>
                            {g.links.map((l) => (
                              <li key={l.path}>
                                <Link href={href(lang, l.path)} aria-current={isCurrent(l, path) ? "page" : undefined}>
                                  {l.label[lang]}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </details>
                ),
              )}
            </nav>
          )}
          <LangSwitch lang={lang} paths={{ de: href("de", path), hr: href("hr", path) }} label={t.langLabel} />
        </div>
      </div>
    </header>
    </>
  );
}
