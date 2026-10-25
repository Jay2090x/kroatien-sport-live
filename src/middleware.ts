import { NextResponse, type NextRequest } from "next/server";

/**
 * Sprachwahl: ?lang=hr|de oder Cookie "lang" (gesetzt beim Umschalten).
 * Nur für die Inhaltsseiten; alles andere (API, Kalenderdateien) bleibt unberührt.
 */
const DE_PATHS = new Set(["/", "/sport", "/spieler", "/legionaere", "/live", "/em-2028", "/talente", "/kalender", "/bildnachweise", "/vatreni", "/frauen", "/u21", "/quiz", "/kroatien-innovativ", "/kroatien-kultur"]);

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const q = url.searchParams.get("lang");
  const isHr = url.pathname === "/hr" || url.pathname.startsWith("/hr/");
  const dePath = isHr ? url.pathname.replace(/^\/hr/, "") || "/" : url.pathname;

  if (q === "hr" || q === "de") {
    const target = url.clone();
    target.searchParams.delete("lang");
    target.pathname = q === "hr" ? (dePath === "/" ? "/hr" : `/hr${dePath}`) : dePath;
    const res = NextResponse.redirect(target);
    res.cookies.set("lang", q, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }
  if (!isHr && (DE_PATHS.has(url.pathname) || url.pathname.startsWith("/vatreni/spiel/")) && req.cookies.get("lang")?.value === "hr") {
    const target = url.clone();
    target.pathname = url.pathname === "/" ? "/hr" : `/hr${url.pathname}`;
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/sport",
    "/spieler",
    "/legionaere",
    "/live",
    "/em-2028",
    "/talente",
    "/kalender",
    "/bildnachweise",
    "/vatreni",
    "/vatreni/spiel/:id",
    "/frauen",
    "/u21",
    "/quiz",
    "/kroatien-innovativ",
    "/kroatien-kultur",
    "/hr",
    "/hr/sport",
    "/hr/spieler",
    "/hr/legionaere",
    "/hr/live",
    "/hr/em-2028",
    "/hr/talente",
    "/hr/kalender",
    "/hr/bildnachweise",
    "/hr/vatreni",
    "/hr/vatreni/spiel/:id",
    "/hr/frauen",
    "/hr/u21",
    "/hr/quiz",
    "/hr/kroatien-innovativ",
    "/hr/kroatien-kultur",
  ],
};
