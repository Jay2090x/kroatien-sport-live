import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { AppProviders } from "@/components/providers/app-providers";
import { getDashboardData } from "@/lib/data/service";
import { FALLBACK_PLAYERS } from "@/lib/data/fallback-players";
import { SITE } from "@/lib/constants";
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
          locale === "hr" ? "hr_HR" : locale === "en" ? "en_US" : "de_DE",
        url: SITE.url,
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
        canonical: SITE.url,
        languages: {
          de: SITE.url,
          en: `${SITE.url}/en`,
          hr: `${SITE.url}/hr`,
        },
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
