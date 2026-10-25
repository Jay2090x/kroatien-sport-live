import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { getVatreniMatches, matchSlug } from "@/lib/sources/vatreni-matches";

export const revalidate = 3600;

type Freq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

/** Jede Seite in DE und HR, mit hreflang-Alternativen. */
function both(path: string, freq: Freq, prio: number, lastModified: Date): MetadataRoute.Sitemap {
  const de = `${SITE.url}${path === "/" ? "/" : path}`;
  const hr = `${SITE.url}${path === "/" ? "/hr" : `/hr${path}`}`;
  const alternates = { languages: { de, hr } };
  return [
    { url: de, lastModified, changeFrequency: freq, priority: prio, alternates },
    { url: hr, lastModified, changeFrequency: freq, priority: Math.max(0.1, +(prio - 0.1).toFixed(1)), alternates },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    ...both("/", "hourly", 1, now),
    ...both("/spieler", "hourly", 0.8, now),
    ...both("/vatreni", "daily", 0.8, now),
    ...both("/sport", "hourly", 0.7, now),
    ...["/legionaere", "/live", "/em-2028", "/talente", "/kalender", "/frauen", "/u21", "/kroatien-innovativ", "/kroatien-kultur"].flatMap((p) => both(p, "daily", 0.6, now)),
    ...both("/quiz", "monthly", 0.5, now),
    ...both("/bildnachweise", "monthly", 0.2, now),
    { url: `${SITE.url}/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/datenschutz`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/nutzung`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
  const m = await getVatreniMatches();
  const cutoff = Date.now() - 400 * 86_400_000;
  for (const x of m?.matches ?? []) {
    if (Date.parse(x.kickoff) < cutoff) continue;
    pages.push(...both(`/vatreni/spiel/${matchSlug(x)}`, x.state === "post" ? "monthly" : "daily", 0.5, new Date(x.state === "post" ? x.kickoff : now)));
  }
  return pages;
}
