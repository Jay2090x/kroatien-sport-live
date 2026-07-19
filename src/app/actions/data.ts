"use server";

import { revalidatePath } from "next/cache";
import { refreshData, getDashboardData } from "@/lib/data/service";
import type { RefreshResult } from "@/types";

/**
 * Server Action: Dashboard-Daten neu laden (Cache invalidieren)
 */
export async function revalidateDashboard(): Promise<{ ok: boolean }> {
  revalidatePath("/");
  revalidatePath("/de");
  revalidatePath("/en");
  return { ok: true };
}

/**
 * Server Action: Daten-Refresh (nur wenn CRON_SECRET serverseitig passt)
 * Für Admin-UI erweiterbar
 */
export async function triggerRefresh(secret?: string): Promise<RefreshResult> {
  if (
    process.env.CRON_SECRET &&
    secret !== process.env.CRON_SECRET &&
    process.env.NODE_ENV === "production"
  ) {
    return {
      success: false,
      matchesUpdated: 0,
      playersUpdated: 0,
      source: "denied",
      errors: ["Unauthorized"],
      timestamp: new Date().toISOString(),
    };
  }

  const result = await refreshData();
  if (result.success) {
    await revalidateDashboard();
  }
  return result;
}

export async function fetchDashboardSnapshot() {
  return getDashboardData();
}
