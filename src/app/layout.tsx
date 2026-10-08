import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SITE } from "@/lib/site";
import "./globals.css";

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
    <html lang="de">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
