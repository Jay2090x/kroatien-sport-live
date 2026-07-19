import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { getDailyNewsAsync, tNews } from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";
import { SITE } from "@/lib/constants";
import { Newspaper, ArrowLeft } from "lucide-react";
import { NewsIndexList } from "@/components/news/news-index-list";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "News" });
  const path = locale === "de" ? "/news" : `/${locale}/news`;
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `${SITE.url}${path}`,
      languages: {
        de: `${SITE.url}/news`,
        en: `${SITE.url}/en/news`,
        hr: `${SITE.url}/hr/news`,
      },
    },
    openGraph: {
      title: `${t("title")} | ${SITE.name}`,
      description: t("subtitle"),
      url: `${SITE.url}${path}`,
      type: "website",
    },
  };
}

export default async function NewsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "News" });

  let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
  let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
  try {
    const data = await getDashboardData();
    matches = data.matches;
    players = data.players;
  } catch {
    /* ok */
  }

  const articles = await getDailyNewsAsync(new Date(), { matches, players });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("subtitle"),
    url: `${SITE.url}${locale === "de" ? "" : `/${locale}`}/news`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: articles.slice(0, 30).map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE.url}${locale === "de" ? "" : `/${locale}`}/news/${a.id}`,
        name: tNews(a.title, locale),
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="mx-auto max-w-3xl px-3 py-6 sm:px-6 sm:py-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backHome")}
        </Link>

        <header className="mb-5 border-b border-border pb-4">
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Newspaper className="h-6 w-6 text-primary" aria-hidden />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("daily")} · {articles.length}
          </p>
        </header>

        <NewsIndexList articles={articles} locale={locale} readMore={t("readMore")} />
      </main>
      <Footer />
    </>
  );
}
