import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async redirects() {
    // Alte URLs (Sprachversionen, Detailseiten) auf die schlanke Startseite umleiten
    return [
      { source: "/de", destination: "/", permanent: false },
      { source: "/de/:path(impressum|datenschutz|nutzung)", destination: "/:path", permanent: false },
      { source: "/:locale(de|en)/:path*", destination: "/", permanent: false },
      { source: "/en", destination: "/", permanent: false },
      // Kurzformen ohne Bindestrich
      { source: "/em2028", destination: "/em-2028", permanent: true },
      { source: "/hr/em2028", destination: "/hr/em-2028", permanent: true },
      // /hr und /hr/<seite> sind die kroatische Version; alte /hr/...-Pfade → /hr
      { source: "/hr/:path((?!sport$|spieler$|legionaere$|live$|em-2028$|talente$|kalender$|bildnachweise$|vatreni$|vatreni/spiel/\\d+$|frauen$|u21$|quiz$|kroatien-innovativ$|kroatien-kultur$).+)", destination: "/hr", permanent: false },
      { source: "/news/:path*", destination: "/#news", permanent: false },
      { source: "/news", destination: "/#news", permanent: false },
      { source: "/match/:path*", destination: "/#vatreni", permanent: false },
      { source: "/player/:path*", destination: "/spieler", permanent: false },
      { source: "/manifest.webmanifest", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
