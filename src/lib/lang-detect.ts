/**
 * Sehr einfache Spracherkennung für kurze Titel (DE | HR | EN), ohne externe Dienste.
 * Zählt typische Funktionswörter und Sonderzeichen. null = nicht sicher erkennbar.
 */
export type TextLang = "de" | "hr" | "en";

const W: Record<TextLang, RegExp> = {
  de: /\b(der|die|das|und|nicht|mit|für|gegen|nach|bei|von|vom|zum|zur|ist|im|ein|eine|einen|auf|wird|sich|auch|noch|beim|trifft|siegt|verliert|gewinnt|über|vor|wie|aus|steht|kroatien|kroaten|nationalmannschaft|fußball|spiel)\b/gi,
  hr: /\b(je|i|u|na|za|od|se|su|da|ne|protiv|nakon|prije|što|kao|ali|ili|iz|sa|s|će|bio|nije|hrvatska|hrvatski|reprezentacija|utakmica|pobjeda|poraz|golom|zabio|izbornik|nogomet|prvenstvo)\b/gi,
  en: /\b(the|and|of|with|for|against|after|from|will|is|at|to|in|on|his|her|their|wins?|beats?|says|vs|match|goal|highlights|best|season|coach|player|interview)\b/gi,
};

export function detectLang(text: string): TextLang | null {
  const s = text.toLowerCase();
  const score: Record<TextLang, number> = { de: 0, hr: 0, en: 0 };
  for (const k of Object.keys(W) as TextLang[]) score[k] = (s.match(W[k]) ?? []).length;
  if (/[čćđ]/.test(s)) score.hr += 2;
  else if (/[šž]/.test(s)) score.hr += 1; // auch in Namen anderer Sprachen
  if (/[äöüß]/.test(s)) score.de += 2;
  const ranked = (Object.entries(score) as Array<[TextLang, number]>).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] === 0 || ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}
