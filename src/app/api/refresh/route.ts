import { NextRequest, NextResponse } from "next/server";
import { refreshData } from "@/lib/data/service";

/**
 * POST /api/refresh
 * Aktualisiert Spieler/Matches aus externen APIs → Supabase
 *
 * Auth: Header `Authorization: Bearer <CRON_SECRET>`
 * Vercel Cron: vercel.json crons → dieser Endpoint
 *
 * Body (optional):
 * { "theSportsDbKey": "...", "footballDataKey": "..." }
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-vercel-cron");

  const authorized =
    (secret && auth === `Bearer ${secret}`) ||
    (secret && request.headers.get("x-cron-secret") === secret) ||
    // Vercel Cron ohne Secret in Dev erlauben wenn kein Secret gesetzt
    (!secret && process.env.NODE_ENV === "development") ||
    Boolean(cronHeader && secret);

  // Strenger in Production
  if (process.env.NODE_ENV === "production" && secret) {
    const tokenOk =
      auth === `Bearer ${secret}` ||
      request.headers.get("x-cron-secret") === secret ||
      Boolean(cronHeader);
    if (!tokenOk) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production" && !secret && !authorized) {
    // Production ohne CRON_SECRET: blocken
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }

  let body: { theSportsDbKey?: string; footballDataKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    // leerer Body OK
  }

  const result = await refreshData({
    theSportsDbKey: body.theSportsDbKey,
    footballDataKey: body.footballDataKey,
  });

  return NextResponse.json(result, {
    status: result.success ? 200 : 207,
  });
}

/** GET für manuelle Health-Checks / Vercel Cron (manche Setups nutzen GET) */
export async function GET(request: NextRequest) {
  return POST(request);
}
