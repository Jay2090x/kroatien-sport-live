/**
 * "Heute vor X Jahren" – handverlesene Momente des kroatischen Fußballs.
 * Jedes Datum, Ergebnis und jeder Torschütze ist gegen die verlinkte Quelle
 * geprüft (Wikipedia-Spielberichte, Stand 17.10.2026). Clips nur von offiziellen
 * Kanälen (FIFA, UEFA); geprüft per YouTube-oEmbed bzw. Abruf der Seite.
 */
export interface Moment {
  date: string; // YYYY-MM-DD
  score?: string; // Anzeige, Heim zuerst
  de: { title: string; text: string };
  hr: { title: string; text: string };
  place: string;
  source: string;
  clip?: { url: string; by: "FIFA" | "UEFA" };
}

const WP = {
  r90s: "https://en.wikipedia.org/wiki/Croatia_national_football_team_results_(1992%E2%80%931999)",
  r00s: "https://en.wikipedia.org/wiki/Croatia_national_football_team_results_(2000%E2%80%932009)",
  r10s: "https://en.wikipedia.org/wiki/Croatia_national_football_team_results_(2010%E2%80%932019)",
  r20s: "https://en.wikipedia.org/wiki/Croatia_national_football_team_results_(2020%E2%80%93present)",
};

export const MOMENTS: Moment[] = [
  {
    date: "1990-10-17",
    score: "Kroatien – USA 2:1",
    de: {
      title: "Das erste Spiel vor der Unabhängigkeit",
      text: "Am Vorabend der Unabhängigkeit spielt eine kroatische Auswahl im Maksimir gegen die USA – ein inoffizielles Freundschaftsspiel, denn der HNS war noch nicht FIFA-Mitglied. Tore: Asanović, Cvjetković.",
    },
    hr: {
      title: "Prva utakmica uoči neovisnosti",
      text: "Uoči neovisnosti hrvatska reprezentacija na Maksimiru igra protiv SAD-a – neslužbena prijateljska utakmica, jer HNS tada još nije bio član FIFA-e. Strijelci: Asanović, Cvjetković.",
    },
    place: "Maksimir, Zagreb",
    source: "https://en.wikipedia.org/wiki/1990_Croatia%E2%80%93United_States_football_match",
  },
  {
    date: "1998-07-04",
    score: "Deutschland – Kroatien 0:3",
    de: { title: "WM-Viertelfinale: 3:0 gegen Deutschland", text: "Jarni, Vlaović und Šuker schießen Kroatien bei der ersten WM-Teilnahme ins Halbfinale." },
    hr: { title: "Četvrtfinale SP-a: 3:0 protiv Njemačke", text: "Jarni, Vlaović i Šuker vode Hrvatsku u polufinale na prvom nastupu na Svjetskom prvenstvu." },
    place: "Stade de Gerland, Lyon",
    source: WP.r90s,
    clip: { url: "https://www.fifa.com/en/watch/5I2OkhgVD7JaSnvKuxsNTC", by: "FIFA" },
  },
  {
    date: "1998-07-11",
    score: "Niederlande – Kroatien 1:2",
    de: { title: "WM-Bronze 1998", text: "Prosinečki und Šuker treffen im Spiel um Platz 3 – Bronze bei der ersten WM." },
    hr: { title: "Bronca na SP-u 1998.", text: "Prosinečki i Šuker zabijaju u utakmici za treće mjesto – bronca na prvom Svjetskom prvenstvu." },
    place: "Parc des Princes, Paris",
    source: WP.r90s,
    clip: { url: "https://www.fifa.com/en/watch/5EEPlWk5SSwmS2YMGn3GwI", by: "FIFA" },
  },
  {
    date: "2007-11-21",
    score: "England – Kroatien 2:3",
    de: { title: "Wembley-Sieg in der EM-Quali", text: "Kranjčar, Olić und Petrić treffen in London – Kroatien gewinnt die Gruppe, England verpasst die EURO 2008." },
    hr: { title: "Pobjeda na Wembleyju u kvalifikacijama", text: "Kranjčar, Olić i Petrić zabijaju u Londonu – Hrvatska osvaja skupinu, Engleska ostaje bez EURA 2008." },
    place: "Wembley, London",
    source: WP.r00s,
  },
  {
    date: "2008-06-12",
    score: "Kroatien – Deutschland 2:1",
    de: { title: "EURO 2008: Sieg gegen Deutschland in Klagenfurt", text: "Srna und Olić treffen im Wörthersee-Stadion – Kroatien steht vorzeitig im Viertelfinale." },
    hr: { title: "EURO 2008.: pobjeda protiv Njemačke u Klagenfurtu", text: "Srna i Olić zabijaju na stadionu Wörthersee – Hrvatska prije kraja skupine u četvrtfinalu." },
    place: "Wörthersee-Stadion, Klagenfurt",
    source: WP.r00s,
  },
  {
    date: "2018-06-21",
    score: "Argentinien – Kroatien 0:3",
    de: { title: "WM 2018: 3:0 gegen Argentinien", text: "Rebić, Modrić und Rakitić – der Auftakt zum Lauf bis ins Finale." },
    hr: { title: "SP 2018.: 3:0 protiv Argentine", text: "Rebić, Modrić i Rakitić – početak puta do finala." },
    place: "Nischni Nowgorod",
    source: WP.r10s,
    clip: { url: "https://www.youtube.com/watch?v=hcM5n71XmBo", by: "FIFA" },
  },
  {
    date: "2018-07-01",
    score: "Kroatien – Dänemark 1:1 n. V., 3:2 i. E.",
    de: { title: "WM-Achtelfinale im Elfmeterschießen", text: "Dänemark vergibt drei Elfmeter, Rakitić verwandelt den entscheidenden." },
    hr: { title: "Osmina finala SP-a nakon jedanaesteraca", text: "Danska promašuje tri jedanaesterca, Rakitić zabija odlučujući." },
    place: "Nischni Nowgorod",
    source: WP.r10s,
    clip: { url: "https://www.youtube.com/watch?v=5_iIW2DZ8nc", by: "FIFA" },
  },
  {
    date: "2018-07-07",
    score: "Russland – Kroatien 2:2 n. V., 3:4 i. E.",
    de: { title: "WM-Viertelfinale gegen den Gastgeber", text: "Kramarić und Vida treffen, im Elfmeterschießen wieder Rakitić – Halbfinale!" },
    hr: { title: "Četvrtfinale SP-a protiv domaćina", text: "Kramarić i Vida zabijaju, u raspucavanju opet Rakitić – polufinale!" },
    place: "Fisht-Stadion, Sotschi",
    source: WP.r10s,
    clip: { url: "https://www.youtube.com/watch?v=wjU8j2bj3RY", by: "FIFA" },
  },
  {
    date: "2018-07-11",
    score: "Kroatien – England 2:1 n. V.",
    de: { title: "Erstes WM-Finale der Geschichte", text: "Perišić gleicht aus, Mandžukić trifft in der Verlängerung – Kroatien steht im WM-Finale." },
    hr: { title: "Prvo finale Svjetskog prvenstva", text: "Perišić izjednačuje, Mandžukić zabija u produžetku – Hrvatska je u finalu SP-a." },
    place: "Luschniki, Moskau",
    source: WP.r10s,
    clip: { url: "https://www.youtube.com/watch?v=gi_2GELMwfY", by: "FIFA" },
  },
  {
    date: "2018-07-15",
    score: "Frankreich – Kroatien 4:2",
    de: { title: "WM-Finale 2018 – Silber", text: "Perišić und Mandžukić treffen im Finale von Moskau. Kroatien wird Vizeweltmeister." },
    hr: { title: "Finale SP-a 2018. – srebro", text: "Perišić i Mandžukić zabijaju u moskovskom finalu. Hrvatska je viceprvak svijeta." },
    place: "Luschniki, Moskau",
    source: WP.r10s,
    clip: { url: "https://www.youtube.com/watch?v=0rtw9uCevMg", by: "FIFA" },
  },
  {
    date: "2018-12-03",
    de: { title: "Modrić gewinnt den Ballon d'Or", text: "Luka Modrić wird als erster Kroate mit dem Ballon d'Or ausgezeichnet." },
    hr: { title: "Modrić osvaja Zlatnu loptu", text: "Luka Modrić prvi je Hrvat koji je osvojio Zlatnu loptu (Ballon d'Or)." },
    place: "Paris",
    source: "https://en.wikipedia.org/wiki/2018_Ballon_d%27Or",
  },
  {
    date: "2021-03-18",
    score: "Dinamo Zagreb – Tottenham 3:0 n. V.",
    de: { title: "Oršić-Dreierpack gegen Tottenham", text: "Nach dem 0:2 im Hinspiel dreht Dinamo das Europa-League-Achtelfinale – Mislav Oršić trifft dreimal." },
    hr: { title: "Oršićev hat-trick protiv Tottenhama", text: "Nakon 0:2 u prvoj utakmici Dinamo preokreće osminu finala Europske lige – Mislav Oršić zabija tri gola." },
    place: "Maksimir, Zagreb",
    source: "https://en.wikipedia.org/wiki/2020%E2%80%9321_GNK_Dinamo_Zagreb_season",
    clip: {
      url: "https://www.uefa.com/uefaeuropaleague/video/highlights/0267-11d467ed5d00-aa619ddbf395-1000--highlights-dinamo-zagreb-3-0-tottenham-aet-2-mins/",
      by: "UEFA",
    },
  },
  {
    date: "2022-12-05",
    score: "Japan – Kroatien 1:1 n. V., 1:3 i. E.",
    de: { title: "Livaković hält drei Elfmeter", text: "Im WM-Achtelfinale von Katar wird Dominik Livaković zum Helden." },
    hr: { title: "Livaković brani tri jedanaesterca", text: "U osmini finala SP-a u Kataru Dominik Livaković postaje junak." },
    place: "Al Wakrah, Katar",
    source: WP.r20s,
    clip: { url: "https://www.youtube.com/watch?v=R9Cyde5w0BE", by: "FIFA" },
  },
  {
    date: "2022-12-09",
    score: "Kroatien – Brasilien 1:1 n. V., 4:2 i. E.",
    de: { title: "Brasilien raus! WM-Viertelfinale 2022", text: "Petković gleicht in der 117. Minute aus, im Elfmeterschießen setzt sich Kroatien durch." },
    hr: { title: "Brazil ispao! Četvrtfinale SP-a 2022.", text: "Petković izjednačuje u 117. minuti, Hrvatska slavi nakon jedanaesteraca." },
    place: "Education City Stadium, Al Rayyan",
    source: WP.r20s,
    clip: { url: "https://www.fifa.com/en/watch/7Banu6D0k8OnqDT9iVyQ8x", by: "FIFA" },
  },
  {
    date: "2022-12-17",
    score: "Kroatien – Marokko 2:1",
    de: { title: "WM-Bronze 2022", text: "Gvardiol und Oršić treffen im Spiel um Platz 3 – die zweite WM-Medaille in Folge." },
    hr: { title: "Bronca na SP-u 2022.", text: "Gvardiol i Oršić zabijaju u utakmici za treće mjesto – druga uzastopna medalja na SP-u." },
    place: "Khalifa International Stadium, Al Rayyan",
    source: WP.r20s,
    clip: { url: "https://www.youtube.com/watch?v=hg8pcLDn-pI", by: "FIFA" },
  },
  {
    date: "2023-06-14",
    score: "Niederlande – Kroatien 2:4 n. V.",
    de: { title: "Nations-League-Halbfinale in Rotterdam", text: "Kramarić, Pašalić, Petković und Modrić – Kroatien steht im Finale." },
    hr: { title: "Polufinale Lige nacija u Rotterdamu", text: "Kramarić, Pašalić, Petković i Modrić – Hrvatska je u finalu." },
    place: "De Kuip, Rotterdam",
    source: WP.r20s,
    clip: { url: "https://www.uefa.com/uefanationsleague/video/highlights/0282-1841dad9d923-72b694703c5b-1000--highlights-netherlands-2-4-croatia/", by: "UEFA" },
  },
  {
    date: "2023-06-18",
    score: "Kroatien – Spanien 0:0 n. V., 4:5 i. E.",
    de: { title: "Nations-League-Finale", text: "Erst im Elfmeterschießen unterliegt Kroatien Spanien knapp." },
    hr: { title: "Finale Lige nacija", text: "Hrvatska tek nakon jedanaesteraca tijesno gubi od Španjolske." },
    place: "De Kuip, Rotterdam",
    source: WP.r20s,
    clip: { url: "https://www.uefa.com/uefanationsleague/video/highlights/0282-1849e8dbf318-42fc65ed6081-1000--final-highlights-croatia-0-0-spain-4-5-pens/", by: "UEFA" },
  },
];

export interface MomentPick {
  moments: Moment[];
  today: boolean;
  /** Jahrestag (YYYY-MM-DD) im laufenden bzw. nächsten Jahr */
  on: string;
}

/** Momente von heute – sonst der nächste Jahrestag (Kalendertag in Wien, "YYYY-MM-DD"). */
export function pickMoments(todayYmd: string): MomentPick {
  const year = Number(todayYmd.slice(0, 4));
  const md = todayYmd.slice(5);
  const todays = MOMENTS.filter((m) => m.date.slice(5) === md);
  if (todays.length) return { moments: todays, today: true, on: todayYmd };
  const upcoming = (y: number) =>
    MOMENTS.map((m) => ({ m, on: `${y}-${m.date.slice(5)}` }))
      .filter((x) => x.on > todayYmd)
      .sort((a, b) => a.on.localeCompare(b.on));
  const list = upcoming(year).length ? upcoming(year) : upcoming(year + 1);
  const on = list[0].on;
  return { moments: list.filter((x) => x.on === on).map((x) => x.m), today: false, on };
}
