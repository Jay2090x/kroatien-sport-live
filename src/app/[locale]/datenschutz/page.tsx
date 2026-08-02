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
    title: t("privacyTitle"),
    robots: { index: true, follow: true },
  };
}

export default async function PrivacyPage({
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
          {t("privacyTitle")}
        </h1>
        <div className="prose-sm mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("privacyIntro")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("privacyController")}
          </h2>
          <p>
            {SITE.name}
            <br />
            <a
              className="text-primary hover:underline"
              href={`mailto:${SITE.contactEmail}`}
            >
              {SITE.contactEmail}
            </a>
          </p>
          <h2 className="text-base font-semibold text-foreground">
            {t("privacyDataTitle")}
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("privacyDataGeo")}</li>
            <li>{t("privacyDataLocal")}</li>
            <li>{t("privacyDataPush")}</li>
            <li>{t("privacyDataLogs")}</li>
            <li>{t("privacyDataThird")}</li>
          </ul>
          <h2 className="text-base font-semibold text-foreground">
            {t("privacyPurposeTitle")}
          </h2>
          <p>{t("privacyPurposeBody")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("privacyNoAdsTitle")}
          </h2>
          <p>{t("privacyNoAdsBody")}</p>
          <h2 className="text-base font-semibold text-foreground">
            {t("privacyRightsTitle")}
          </h2>
          <p>{t("privacyRightsBody")}</p>
          <p className="text-xs">{t("privacyUpdate")}</p>
          <p>
            <Link href="/impressum" className="text-primary hover:underline">
              {t("impressumTitle")}
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
