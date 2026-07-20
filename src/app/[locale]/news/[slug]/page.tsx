import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import {
  getNewsBySlug,
  getAllNewsSlugs,
  tNews,
  NEWS_CATEGORY_LABEL,
} from "@/lib/data/news";
import { getDashboardData } from "@/lib/data/service";
import { SITE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const slugs = await getAllNewsSlugs();
    const locales = ["de", "en", "hr"] as const;
    return locales.flatMap((locale) =>
      slugs.slice(0, 40).map((slug) => ({ locale, slug }))
    );
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  let matches: Awaited<ReturnType<typeof getDashboardData>>["matches"] = [];
  let players: Awaited<ReturnType<typeof getDashboardData>>["players"] = [];
  try {
    const data = await getDashboardData();
    matches = data.matches;
    players = data.players;
  } catch {
    /* ok */
  }
  const article = await getNewsBySlug(slug, { matches, players });
  if (!article) return { title: "News" };

  const title = tNews(article.title, locale);
  const description = tNews(article.summary, locale);
  const path =
    locale === "de" ? `/news/${slug}` : `/${locale}/news/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE.url}${path}`,
      languages: {
        de: `${SITE.url}/news/${slug}`,
        en: `${SITE.url}/en/news/${slug}`,
        hr: `${SITE.url}/hr/news/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${SITE.url}${path}`,
      publishedTime: article.date,
      images: article.image?.url ? [{ url: article.image.url }] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function bodyParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    // keine reinen URL-Absätze
    .filter((p) => !/^https?:\/\//i.test(p) && p.length > 2);
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
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

  const article = await getNewsBySlug(slug, { matches, players });
  if (!article) notFound();

  const title = tNews(article.title, locale);
  const summary = tNews(article.summary, locale);
  const body = tNews(article.body, locale);
  const paras = bodyParagraphs(body);
  const cat = tNews(NEWS_CATEGORY_LABEL[article.category], locale);
  const img = article.image;
  const isCutout = img ? /cutout/i.test(img.url) : false;
  const isLogo = img
    ? /badge|logo|thumb|teamlogos|leaguelogos|countries/i.test(img.url)
    : false;
  const path =
    locale === "de" ? `/news/${slug}` : `/${locale}/news/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary,
    datePublished: article.date,
    dateModified: article.date,
    inLanguage: locale,
    mainEntityOfPage: `${SITE.url}${path}`,
    image: img?.url ? [img.url] : undefined,
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-6 sm:py-8">
        <nav className="mb-5 flex flex-wrap gap-3 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backHome")}
          </Link>
          <Link
            href="/news"
            className="text-muted-foreground hover:text-foreground"
          >
            {t("allNews")}
          </Link>
        </nav>

        <article itemScope itemType="https://schema.org/NewsArticle">
          <meta itemProp="datePublished" content={article.date} />

          {/* Kompakter Header: kleines Thumb + Meta */}
          <div className="flex gap-3 border-b border-border pb-4">
            {img && (
              <div
                className={
                  isCutout
                    ? "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-gradient-to-b from-[#0b1f4a] to-[#1a3a6b] sm:h-24 sm:w-24"
                    : "relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary sm:h-24 sm:w-24"
                }
              >
                <Image
                  src={img.url}
                  alt={tNews(img.alt, locale)}
                  width={96}
                  height={96}
                  itemProp="image"
                  className={
                    isCutout
                      ? "h-full w-full object-contain object-bottom p-0.5"
                      : isLogo
                        ? "h-full w-full object-contain p-2"
                        : "h-full w-full object-cover"
                  }
                  unoptimized
                  priority
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline">{tNews(article.tag, locale)}</Badge>
                <Badge variant="secondary">{cat}</Badge>
                <time dateTime={article.date} className="text-muted-foreground">
                  {article.date}
                </time>
              </div>
              <h1
                itemProp="headline"
                className="mt-1.5 text-xl font-bold leading-snug tracking-tight sm:text-2xl"
              >
                {title}
              </h1>
            </div>
          </div>

          <p
            itemProp="description"
            className="mt-4 text-[15px] leading-relaxed text-muted-foreground"
          >
            {summary}
          </p>

          <div
            itemProp="articleBody"
            className="mt-5 space-y-3 border-t border-border pt-5"
          >
            {paras.map((p, i) => (
              <p
                key={i}
                className="text-[15px] leading-7 text-foreground/90 break-words"
              >
                {p}
              </p>
            ))}
          </div>

          {article.sourceUrl && article.sourceUrl.startsWith("http") && (
            <p className="mt-6">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <span className="truncate">{t("originalSource")}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            </p>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
