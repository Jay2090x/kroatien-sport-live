import { SITE } from "@/lib/constants";
import type { Locale } from "@/i18n/routing";

export function localePath(locale: string, path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === "de") return clean === "/" ? "/" : clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export function absoluteUrl(locale: string, path = "/"): string {
  const p = localePath(locale, path);
  return p === "/" ? SITE.url : `${SITE.url}${p}`;
}

export function languageAlternates(path = "/"): Record<string, string> {
  return {
    de: absoluteUrl("de", path),
    en: absoluteUrl("en", path),
    hr: absoluteUrl("hr", path),
    "x-default": absoluteUrl("de", path),
  };
}

export function asLocale(locale: string): Locale {
  return locale === "en" || locale === "hr" ? locale : "de";
}
