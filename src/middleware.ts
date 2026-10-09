import { NextResponse, type NextRequest } from "next/server";

/**
 * Sprachwahl: ?lang=hr|de oder Cookie "lang" (gesetzt beim Umschalten).
 * Nur für die drei Inhaltsseiten; alles andere bleibt unberührt.
 */
const DE_PATHS = new Set(["/", "/sport", "/spieler"]);

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
  if (!isHr && DE_PATHS.has(url.pathname) && req.cookies.get("lang")?.value === "hr") {
    const target = url.clone();
    target.pathname = url.pathname === "/" ? "/hr" : `/hr${url.pathname}`;
    return NextResponse.redirect(target);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/sport", "/spieler", "/hr", "/hr/sport", "/hr/spieler"],
};
