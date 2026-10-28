import type { Lang } from "./i18n";

/** Eine zentrale Seitenstruktur für Hauptmenü, Mobil-Menü und Footer-Sitemap (DE | HR). */
export type NavLink = { path: string; label: Record<Lang, string>; hint?: Record<Lang, string> };
export type NavGroup = { title: Record<Lang, string>; links: NavLink[] };
export type NavItem =
  | { kind: "link"; key: string; link: NavLink }
  | { kind: "menu"; key: string; label: Record<Lang, string>; groups: NavGroup[] };

const L = (path: string, de: string, hr: string, hint?: [string, string]): NavLink => ({
  path,
  label: { de, hr },
  hint: hint ? { de: hint[0], hr: hint[1] } : undefined,
});

export const NAV: NavItem[] = [
  {
    kind: "menu",
    key: "vatreni",
    label: { de: "Vatreni", hr: "Vatreni" },
    groups: [
      {
        title: { de: "Spiele", hr: "Utakmice" },
        links: [
          L("/#vatreni", "Aktuell: Ergebnisse & Tabelle", "Aktualno: rezultati i tablica"),
          L("/vatreni", "Alle Spiele & Spielberichte", "Sve utakmice i izvještaji"),
          L("/live", "Live-Ticker", "Prijenos uživo"),
          L("/em-2028", "EM-2028-Qualifikation", "Kvalifikacije za EURO 2028."),
        ],
      },
      {
        title: { de: "Geschichte & Statistik", hr: "Povijest i statistika" },
        links: [
          L("/vatreni-momente", "Vatreni-Momente", "Trenuci Vatrenih"),
          L("/kroatien-in-zahlen", "Kroatien in Zahlen", "Hrvatska u brojkama"),
          L("/bilanz", "Bilanz gegen alle Gegner", "Bilanca protiv svih protivnika"),
        ],
      },
      {
        title: { de: "Weitere Teams", hr: "Ostale reprezentacije" },
        links: [
          L("/frauen", "Frauen-Nationalteam", "Ženska reprezentacija"),
          L("/u21", "U21-Nationalteam", "U21 reprezentacija"),
        ],
      },
    ],
  },
  {
    kind: "menu",
    key: "spieler",
    label: { de: "Spieler", hr: "Igrači" },
    groups: [
      {
        title: { de: "Spieler", hr: "Igrači" },
        links: [
          L("/spieler", "Kader & Form", "Momčad i forma"),
          L("/legionaere", "Legionäre-Wochenende", "Vikend legionara"),
          L("/legionaere#europacup", "Kroaten im Europacup", "Hrvati u europskim kupovima"),
          L("/talente", "Talente-Radar", "Radar talenata"),
        ],
      },
    ],
  },
  { kind: "link", key: "hnl", link: L("/#hnl", "HNL", "HNL") },
  { kind: "link", key: "news", link: L("/#feed", "News", "Vijesti") },
  { kind: "link", key: "sport", link: L("/sport", "Sport", "Sport") },
  {
    kind: "menu",
    key: "mehr",
    label: { de: "Mehr", hr: "Više" },
    groups: [
      {
        title: { de: "Mitmachen", hr: "Za navijače" },
        links: [
          L("/quiz", "Vatreni-Quiz", "Kviz o Vatrenima"),
          L("/kalender", "Kalender abonnieren", "Pretplata na kalendar"),
        ],
      },
      {
        title: { de: "Kroatien", hr: "Hrvatska" },
        links: [
          L("/kroatien-innovativ", "Kroatien innovativ", "Hrvatska inovativna"),
          L("/kroatien-kultur", "Musik & Film", "Glazba i film"),
        ],
      },
    ],
  },
];

const strip = (p: string) => p.split("#")[0] || "/";

/** Ist dieser Menüpunkt die aktuelle Seite? (Anker auf der Startseite zählen nicht.) */
export function isCurrent(link: NavLink, path: string): boolean {
  if (link.path.includes("#")) return false;
  if (link.path === "/vatreni") return path === "/vatreni" || path.startsWith("/vatreni/");
  return strip(link.path) === path;
}

export function itemActive(item: NavItem, path: string): boolean {
  if (item.kind === "link") return isCurrent(item.link, path);
  return item.groups.some((g) => g.links.some((l) => isCurrent(l, path)));
}

/** Zurück-Link (Pill neben der Überschrift): immer zur übergeordneten Rubrik. */
export function backLink(path: string, lang: Lang): { path: string; label: string } {
  const item = NAV.find((i) => i.kind === "menu" && itemActive(i, path));
  if (item?.key === "spieler" && path !== "/spieler") return { path: "/spieler", label: lang === "hr" ? "← Igrači" : "← Spieler" };
  if (item?.key === "vatreni" || path === "/spieler") return { path: "/#vatreni", label: "← Vatreni" };
  return { path: "/", label: lang === "hr" ? "← Početna" : "← Start" };
}
