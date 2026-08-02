import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { LEGAL_DISCLAIMER } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });
  return {
    title: t("termsTitle"),
    robots: { index: true, follow: true },
  };
}

export default async function TermsPage({
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
        <h1 className="text-2xl font-bold tracking-tight">{t("termsTitle")}</h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("termsIntro")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("termsServiceTitle")}
          </h2>
          <p>{t("termsServiceBody")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("termsLinksTitle")}
          </h2>
          <p>{t("termsLinksBody")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("termsUgcTitle")}
          </h2>
          <p>{t("termsUgcBody")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("termsLiabilityTitle")}
          </h2>
          <p>{t("termsLiabilityBody")}</p>
          <p className="rounded-lg border border-border bg-card p-3 text-xs">
            {LEGAL_DISCLAIMER}
          </p>
          <p>
            <Link href="/impressum" className="text-primary hover:underline">
              {t("impressumTitle")}
            </Link>
            {" · "}
            <Link href="/datenschutz" className="text-primary hover:underline">
              {t("privacyTitle")}
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
