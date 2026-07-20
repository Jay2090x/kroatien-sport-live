import { NextRequest, NextResponse } from "next/server";

/**
 * Erkennt Nutzerland (primär Vercel Edge Header, Fallback ipapi.co).
 * Keine Speicherung – nur für regionale Free-TV-Hinweise.
 */
export async function GET(req: NextRequest) {
  const headerCountry =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code");

  if (headerCountry && headerCountry !== "XX" && headerCountry.length === 2) {
    return NextResponse.json(
      {
        country: headerCountry.toUpperCase(),
        source: "edge",
      },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      }
    );
  }

  // Fallback: Client-IP über ipapi (rate-limited free tier)
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const url = ip
      ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
      : "https://ipapi.co/json/";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        country_code?: string;
        country_name?: string;
        error?: boolean;
      };
      if (!data.error && data.country_code) {
        return NextResponse.json({
          country: data.country_code.toUpperCase(),
          countryName: data.country_name,
          source: "ipapi",
        });
      }
    }
  } catch {
    /* ignore */
  }

  return NextResponse.json({ country: null, source: "unknown" });
}
