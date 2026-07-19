import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "hr"],
  defaultLocale: "de",
  localePrefix: "as-needed", // DE ohne Prefix, EN/HR mit /en /hr
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_META: Record<
  Locale,
  { label: string; short: string; flag: string }
> = {
  de: { label: "Deutsch", short: "DE", flag: "🇩🇪" },
  en: { label: "English", short: "EN", flag: "🇬🇧" },
  hr: { label: "Hrvatski", short: "HR", flag: "🇭🇷" },
};
