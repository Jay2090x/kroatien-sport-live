/**
 * Sehr einfache Spracherkennung für kurze Titel (DE | HR | EN), ohne externe Dienste.
 * Zählt typische Funktionswörter und Sonderzeichen. null = nicht sicher erkennbar.
 *
 * Wichtig: JS-\\b behandelt čćšđž (und äöüß) nicht als Wortzeichen. Sonst würde
 * z. B. „su“ in „Sučić“ oder „i“ in „Livaković“ als kroatisches Funktionswort zählen
 * und deutsche Titel über kroatische Spieler fälschlich als HR landen.
 */
export type TextLang = "de" | "hr" | "en";

/** Wortgrenzen, die alle Buchstaben (inkl. kroatischer und deutscher Umlaute) als Wortzeichen zählen. */
const B = String.raw`(?<![\p{L}\p{N}_])`;
const E = String.raw`(?![\p{L}\p{N}_])`;
const words = (alt: string) => new RegExp(`${B}(?:${alt})${E}`, "giu");

const W: Record<TextLang, RegExp> = {
  de: words(
    "der|die|das|und|nicht|mit|für|gegen|nach|bei|von|vom|zum|zur|ist|im|ein|eine|einen|einem|eines|den|dem|des|als|auf|wird|sich|auch|noch|beim|trifft|siegt|verliert|gewinnt|über|vor|wie|aus|steht|muss|fehlt|verzichten|könnte|kein|keine|kroatien|kroatiens|kroaten|nationalmannschaft|nationalspieler|fußball|spiel"
  ),
  hr: words(
    "je|i|u|na|za|od|se|su|da|ne|protiv|nakon|prije|što|kao|ali|ili|iz|sa|s|će|bio|nije|hrvatska|hrvatski|hrvatsku|reprezentacija|utakmica|pobjeda|poraz|golom|zabio|izbornik|nogomet|prvenstvo"
  ),
  en: words(
    "the|and|of|with|for|against|after|from|will|is|at|to|in|on|his|her|their|wins?|beats?|says|vs|match|goal|highlights|best|season|coach|player|interview"
  ),
};

export function detectLang(text: string): TextLang | null {
  const s = text.toLowerCase();
  const score: Record<TextLang, number> = { de: 0, hr: 0, en: 0 };
  for (const k of Object.keys(W) as TextLang[]) {
    W[k].lastIndex = 0;
    score[k] = (s.match(W[k]) ?? []).length;
  }
  // čćđ/šž stehen oft nur in Spielernamen (Modrić, Sučić, Rudeš) – auch in deutschen
  // Titeln. Deshalb nur verstärken, wenn schon kroatische Funktionswörter da sind.
  if (score.hr > 0) {
    if (/[čćđ]/.test(s)) score.hr += 2;
    else if (/[šž]/.test(s)) score.hr += 1;
  }
  if (/[äöüß]/.test(s)) score.de += 2;
  const ranked = (Object.entries(score) as Array<[TextLang, number]>).sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] > 0 && ranked[0][1] > ranked[1][1]) return ranked[0][0];
  // unentschieden oder nichts: eindeutige Schriftzeichen, sonst unsicher
  if (score.de === 0 && score.en === 0 && /[čćđ]/.test(s)) return "hr";
  if (score.hr === 0 && score.en === 0 && /[äöüß]/.test(s)) return "de";
  return null;
}
