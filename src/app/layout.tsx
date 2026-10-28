import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import { SPORT_FILTER_BOOT, SPORT_FILTER_CSS } from "@/components/sport-filter";
import { HTML_LANG_BOOT, HtmlLang } from "@/components/html-lang";
import "./globals.css";
import "./fan.css";
import "./theme.css";
import { Inter, Barlow_Condensed } from "next/font/google";

// Schriften werden beim Build heruntergeladen und von der eigenen Domain ausgeliefert (keine Google-Anfrage im Browser).
const inter = Inter({ subsets: ["latin", "latin-ext"], display: "swap", variable: "--font-inter" });
const barlow = Barlow_Condensed({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"], display: "swap", variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} – Vatreni, SuperSport HNL & News`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: SITE.name,
    title: `${SITE.name} – Vatreni, SuperSport HNL & News`,
    description: SITE.description,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#d7141a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning className={`${inter.variable} ${barlow.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HTML_LANG_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: SPORT_FILTER_BOOT }} />
        <style dangerouslySetInnerHTML={{ __html: SPORT_FILTER_CSS }} />
      </head>
      <body>
        {children}
        <Analytics />
        <HtmlLang />
      </body>
    </html>
  );
}
