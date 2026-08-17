import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/components/providers/app-providers";
import { getDashboardData } from "@/lib/data/service";
import { FALLBACK_PLAYERS } from "@/lib/data/fallback-players";
import { SITE } from "@/lib/constants";
import { absoluteUrl, languageAlternates } from "@/lib/seo";
import { SiteJsonLd } from "@/components/seo/json-ld";
import type { Metadata } from "next";

/** Live-Daten – kein harter SSG-Crash bei API-Fehlern */
export const dynamic = "force-dynamic";
export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  try {
    const t = await getTranslations({ locale, namespace: "Meta" });
    const url = absoluteUrl(locale, "/");
    return {
      title: {
        default: t("title"),
        template: `%s | ${SITE.name}`,
      },
      description: t("description"),
      keywords: t("keywords").split(", ").map((k) => k.trim()),
      authors: [{ name: SITE.name }],
      openGraph: {
        type: "website",
        locale:
          locale === "hr" ? "hr_HR" : locale === "en" ? "en_GB" : "de_DE",
        url,
        siteName: SITE.name,
        title: t("title"),
        description: t("description"),
      },
      twitter: {
        card: "summary_large_image",
        title: t("title"),
        description: t("description"),
      },
      robots: { index: true, follow: true },
      alternates: {
        canonical: url,
        languages: languageAlternates("/"),
      },
    };
  } catch {
    return { title: SITE.name };
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  let messages: Record<string, unknown> = {};
  try {
    messages = (await getMessages()) as Record<string, unknown>;
  } catch {
    // Fallback leere Messages – UI zeigt keys
    messages = {};
  }

  // Daten nie den Request crashen lassen
  let data: Awaited<ReturnType<typeof getDashboardData>>;
  try {
    data = await Promise.race([
      getDashboardData(),
      new Promise<Awaited<ReturnType<typeof getDashboardData>>>((_, reject) =>
        setTimeout(() => reject(new Error("dashboard timeout")), 20_000)
      ),
    ]);
  } catch (e) {
    data = {
      matches: [],
      players: FALLBACK_PLAYERS,
      lastUpdated: new Date().toISOString(),
      source: "fallback",
      errors: [e instanceof Error ? e.message : "Dashboard load failed"],
    };
  }

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)};`,
        }}
      />
      <SiteJsonLd
        locale={locale}
        matches={data.matches}
        faq={faqFromMessages(messages)}
      />
      <AppProviders
        initialMatches={data.matches}
        initialPlayers={data.players}
        lastUpdated={data.lastUpdated}
        dataSource={data.source}
        dataErrors={"errors" in data ? data.errors : undefined}
      >
        {children}
      </AppProviders>
    </NextIntlClientProvider>
  );
}

function faqFromMessages(
  messages: Record<string, unknown>
): { q: string; a: string }[] {
  const faq = messages.Faq as Record<string, string> | undefined;
  if (!faq) return [];
  return [1, 2, 3, 4, 5]
    .map((n) => ({
      q: faq[`q${n}`] ?? "",
      a: n === 1 ? (faq.a1Fallback ?? faq.a1 ?? "") : (faq[`a${n}`] ?? ""),
    }))
    .filter((x) => x.q && x.a);
}
