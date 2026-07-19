import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "**.thesportsdb.com" },
      { protocol: "https", hostname: "crests.football-data.org" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  // Vercel / Edge-friendly
  poweredByHeader: false,
  compress: true,
};

export default withNextIntl(nextConfig);
