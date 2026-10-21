import type { Metadata } from "next";
import { SITE } from "./site";
import type { Lang } from "./i18n";

/** Pfad in Sprache (dePath "/" → "/hr") */
function lp(lang: Lang, dePath: string) {
  if (lang === "de") return dePath;
  return dePath === "/" ? "/hr" : `/hr${dePath}`;
}

/** URL des dynamischen Vorschaubilds (src/app/og/route.tsx) */
export function ogUrl(title: string, sub?: string, lang: Lang = "de") {
  const q = new URLSearchParams({ t: title.slice(0, 90) });
  if (sub) q.set("s", sub.slice(0, 120));
  if (lang === "hr") q.set("l", "hr");
  return `/og?${q.toString()}`;
}

/**
 * Kanonische URL, hreflang (de/hr/x-default), OpenGraph + Twitter-Karte mit
 * dynamischem Vorschaubild. title ohne Seitennamen (Template fügt ihn an).
 */
export function seo(
  dePath: string,
  lang: Lang,
  title: string,
  description?: string,
  og?: { title?: string; sub?: string }
): Pick<Metadata, "alternates" | "openGraph" | "twitter"> {
  const url = lp(lang, dePath);
  const img = ogUrl(og?.title ?? title, og?.sub ?? description, lang);
  const full = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  return {
    alternates: {
      canonical: url,
      languages: { de: lp("de", dePath), hr: lp("hr", dePath), "x-default": lp("de", dePath) },
    },
    openGraph: {
      type: "website",
      siteName: SITE.name,
      locale: lang === "hr" ? "hr_HR" : "de_DE",
      alternateLocale: lang === "hr" ? ["de_DE"] : ["hr_HR"],
      url,
      title: full,
      description,
      images: [{ url: img, width: 1200, height: 630, alt: og?.title ?? title }],
    },
    twitter: { card: "summary_large_image", title: full, description, images: [img] },
  };
}
