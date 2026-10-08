// Hinweis: ESPN blockt User-Agents mit URL ("+https://…") mit 403.
const UA = "KroatienSportLive/3.0 (kroatien-sport-live.vercel.app)";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * fetch mit Timeout und einem Retry (bei Netzwerkfehler, 429 oder 5xx).
 * Wirft bei Fehlern – Caching/Fallback übernimmt `cachedSource`.
 */
export async function fetchText(
  url: string,
  { timeoutMs = 8000, retries = 1 }: { timeoutMs?: number; retries?: number } = {}
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json, application/xml, text/xml, */*" },
        signal: controller.signal,
      });
      if (res.ok) return await res.text();
      lastError = new Error(`HTTP ${res.status} for ${url}`);
      if (res.status !== 429 && res.status < 500) break;
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) await sleep(1500 * (attempt + 1));
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
