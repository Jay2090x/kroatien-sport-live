// Hinweis: ESPN blockt User-Agents mit URL ("+https://…") mit 403.
const UA = "KroatienSportLive/3.0 (kroatien-sport-live.vercel.app)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/*
 * ESPN drosselt Bursts: Die Spieler-Seite löste pro Neuaufbau ~250 parallele
 * Abrufe aus, danach antwortete ESPN dem Live-Server stundenlang mit 403
 * (2026-11-02). Deshalb höchstens ESPN_MAX gleichzeitige ESPN-Abrufe.
 */
const ESPN_MAX = 6;
let espnActive = 0;
const espnQueue: Array<() => void> = [];
async function espnSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (espnActive >= ESPN_MAX) await new Promise<void>((r) => espnQueue.push(r));
  espnActive++;
  try {
    return await fn();
  } finally {
    espnActive--;
    espnQueue.shift()?.();
  }
}

/**
 * fetch mit Timeout und einem Retry (bei Netzwerkfehler, 429 oder 5xx).
 * Wirft bei Fehlern – Caching/Fallback übernimmt `cachedSource`.
 */
export async function fetchText(
  url: string,
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<string> {
  // TheSportsDB Free-API ist oft langsam/522; kurze Timeouts, sonst blockiert
  // die ISR-Revalidierung (> maxDuration) und die Seite bleibt stundenlang STALE.
  const isTsdb = url.includes("thesportsdb.com");
  const isEspn = /(^|\.)espn\.com\//.test(new URL(url).host + "/");
  const timeoutMs = opts.timeoutMs ?? (isTsdb ? 3000 : 8000);
  const retries = opts.retries ?? (isTsdb ? 0 : 1);
  let lastError: unknown;
  let waitMs = 0;
  for (let attempt = 0; attempt <= retries; attempt++) {
    waitMs = 1500 * (attempt + 1);
    // Timeout erst ab Start des Abrufs (nicht schon in der ESPN-Warteschlange)
    const doFetch = async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": UA, Accept: "application/json, application/xml, text/xml, */*" },
          signal: controller.signal,
        });
        const body = res.ok ? await res.text() : "";
        return { ok: res.ok, status: res.status, retryAfter: res.headers.get("retry-after"), body };
      } finally {
        clearTimeout(timer);
      }
    };
    try {
      const res = isEspn ? await espnSlot(doFetch) : await doFetch();
      if (res.ok) return res.body;
      lastError = new Error(`HTTP ${res.status} for ${url}`);
      if (res.status === 429) {
        // Rate-Limit respektieren (Retry-After in Sekunden, max. 10 s)
        const ra = Number(res.retryAfter);
        if (Number.isFinite(ra) && ra > 0) waitMs = Math.min(10, ra) * 1000 + 250;
      }
      if (res.status !== 429 && res.status < 500) break;
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) await sleep(waitMs);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function fetchJson<T>(
  url: string,
  opts?: { timeoutMs?: number; retries?: number }
): Promise<T> {
  const text = await fetchText(url, opts);
  return JSON.parse(text) as T;
}
