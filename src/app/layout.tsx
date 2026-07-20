import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Root layout – locale-spezifische Metadata kommt aus [locale]/layout
 * next-intl erwartet dieses Root-Layout ohne html/body-Duplikate idealerweise,
 * aber Next.js 15 erfordert html/body hier oder im locale-layout.
 * Wir halten Root minimal und setzen html/body im locale-layout.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://kroatien-sport-live.vercel.app"
  ),
  applicationName: "Kroatien Sport Live",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KSL",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
