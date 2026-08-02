import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SITE } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });
  return {
    title: t("impressumTitle"),
    robots: { index: true, follow: true },
  };
}

/**
 * Impressum ohne personenbezogene Adresse/Name im Klartext.
 * Kontakt nur per E-Mail an die Projekt-Adresse.
 */
export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Legal");

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-3 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("impressumTitle")}
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">{t("provider")}</strong>
            <br />
            {SITE.name}
            <br />
            {t("providerType")}
          </p>
          <p>
            <strong className="text-foreground">{t("contact")}</strong>
            <br />
            {t("contactOnlyEmail")}
            <br />
            <a
              className="font-medium text-primary hover:underline"
              href={`mailto:${SITE.contactEmail}`}
            >
              {SITE.contactEmail}
            </a>
          </p>
          <p>{t("impressumBody")}</p>
          <p className="text-xs">{t("noPersonalData")}</p>
          <p>
            <Link href="/datenschutz" className="text-primary hover:underline">
              {t("privacyTitle")}
            </Link>
            {" · "}
            <Link href="/nutzung" className="text-primary hover:underline">
              {t("termsTitle")}
            </Link>
            {" · "}
            <Link href="/" className="text-primary hover:underline">
              {t("backHome")}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
