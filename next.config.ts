import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async redirects() {
    // Alte URLs (Sprachversionen, Detailseiten) auf die schlanke Startseite umleiten
    return [
      { source: "/de", destination: "/", permanent: false },
      { source: "/de/:path(impressum|datenschutz|nutzung)", destination: "/:path", permanent: false },
      { source: "/:locale(de|en|hr)/:path*", destination: "/", permanent: false },
      { source: "/:locale(en|hr)", destination: "/", permanent: false },
      { source: "/news/:path*", destination: "/#news", permanent: false },
      { source: "/news", destination: "/#news", permanent: false },
      { source: "/match/:path*", destination: "/#vatreni", permanent: false },
      { source: "/player/:path*", destination: "/", permanent: false },
      { source: "/manifest.webmanifest", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
