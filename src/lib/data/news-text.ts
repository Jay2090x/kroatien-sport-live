/**
 * Robuste Text-Bereinigung für News (RSS/Google HTML-Müll).
 */

/** Dekodiert Entities und entfernt jedes HTML – nie rohes Markup anzeigen */
export function sanitizeNewsDisplay(raw: string, maxLen = 280): string {
  if (!raw) return "";
  let s = String(raw);

  s = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1");

  // Bis zu 4× dekodieren (Google: &amp;lt;a …)
  for (let i = 0; i < 4; i++) {
    const prev = s;
    s = s
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#0*39;/g, "'")
      .replace(/&#x27;/gi, "'")
      .replace(/&#(\d+);/g, (_, n) => {
        const c = Number(n);
        return c > 31 && c < 0x110000 ? String.fromCodePoint(c) : " ";
      })
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
        const c = parseInt(h, 16);
        return c > 31 && c < 0x110000 ? String.fromCodePoint(c) : " ";
      });
    if (s === prev) break;
  }

  // Tags entfernen, Linktext behalten
  s = s
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, " $1 ")
    .replace(/<\/?[a-zA-Z][^>]*>/g, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[<>{}[\]]/g, " ")
    .replace(/&[a-zA-Z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Publisher-Suffix
  s = s.replace(/\s+[-–|]\s+[\w .,&'’-]{2,50}$/u, "").trim();

  // Immer noch verdächtig → verwerfen
  if (
    !s ||
    /href\s*=|target\s*=|_blank|<\/?[a-z]|font\s*color|&lt;|&gt;|&nbsp;/i.test(
      s
    )
  ) {
    return "";
  }

  if (s.length > maxLen) {
    s = s.slice(0, maxLen - 1).replace(/\s+\S*$/, "") + "…";
  }
  return s;
}

export function looksLikeHtmlGarbage(s: string): boolean {
  if (!s) return false;
  return /<\/?[a-z]|href\s*=|&lt;|&gt;|&nbsp;|target\s*=|_blank|font\s*color/i.test(
    s
  );
}

export function isUsableHeadline(s: string): boolean {
  if (!s || s.length < 10) return false;
  if (looksLikeHtmlGarbage(s)) return false;
  // Mindestens 2 Wörter
  if (s.split(/\s+/).length < 2) return false;
  return true;
}
