/**
 * Vatreni-Quiz – jede Antwort wurde am 21.10.2026 gegen die verlinkte
 * Wikipedia-Seite (en) geprüft. a = Index der richtigen Antwort.
 */
export interface QuizQ {
  q: { de: string; hr: string };
  options: { de: string[]; hr: string[] };
  a: number;
  fact: { de: string; hr: string };
  source: { title: string; url: string };
}

const W = (t: string) => ({ title: `Wikipedia: ${t.replace(/_/g, " ")}`, url: `https://en.wikipedia.org/wiki/${encodeURI(t)}` });
const same = (xs: string[]) => ({ de: xs, hr: xs });

export const QUIZ: QuizQ[] = [
  {
    q: { de: "Welchen Platz belegte Kroatien bei seiner ersten WM 1998 in Frankreich?", hr: "Koje je mjesto Hrvatska osvojila na svom prvom SP-u 1998. u Francuskoj?" },
    options: { de: ["Viertelfinale", "Platz 3 (Bronze)", "Platz 2", "Platz 4"], hr: ["Četvrtfinale", "3. mjesto (bronca)", "2. mjesto", "4. mjesto"] },
    a: 1,
    fact: { de: "Kroatien gewann 1998 bei der ersten WM-Teilnahme Bronze.", hr: "Hrvatska je 1998. na prvom nastupu na SP-u osvojila broncu." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Gegen wen gewann Kroatien 1998 das Spiel um Platz 3?", hr: "Protiv koga je Hrvatska 1998. dobila utakmicu za 3. mjesto?" },
    options: { de: ["Niederlande", "Deutschland", "Brasilien", "Italien"], hr: ["Nizozemska", "Njemačka", "Brazil", "Italija"] },
    a: 0,
    fact: { de: "2:1 gegen die Niederlande – Šuker erzielte das Siegtor.", hr: "2:1 protiv Nizozemske – Šuker je zabio pobjednički gol." },
    source: W("Davor_Šuker"),
  },
  {
    q: { de: "Wie viele Tore schoss Davor Šuker bei der WM 1998 (Goldener Schuh)?", hr: "Koliko je golova Davor Šuker zabio na SP-u 1998. (Zlatna kopačka)?" },
    options: same(["4", "5", "6", "8"]),
    a: 2,
    fact: { de: "Sechs Tore in sieben Spielen – Goldener Schuh als bester Torschütze.", hr: "Šest golova u sedam utakmica – Zlatna kopačka za najboljeg strijelca." },
    source: W("Davor_Šuker"),
  },
  {
    q: { de: "Wie endete das WM-Viertelfinale 1998 gegen Deutschland?", hr: "Kako je završila četvrtfinalna utakmica SP-a 1998. protiv Njemačke?" },
    options: same(["1:0", "2:1 n. V.", "3:0", "2:0"]),
    a: 2,
    fact: { de: "3:0 durch Jarni, Vlaović und Šuker.", hr: "3:0 golovima Jarnija, Vlaovića i Šukera." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Welcher Franzose drehte das WM-Halbfinale 1998 mit seinen einzigen zwei Länderspieltoren?", hr: "Koji je Francuz preokrenuo polufinale SP-a 1998. svojim jedinim dvama golovima za reprezentaciju?" },
    options: same(["Zinédine Zidane", "Lilian Thuram", "Thierry Henry", "Didier Deschamps"]),
    a: 1,
    fact: { de: "Šuker traf zum 1:0, Lilian Thuram drehte das Spiel zum 2:1 für Frankreich.", hr: "Šuker je zabio za 1:0, a Lilian Thuram preokrenuo na 2:1 za Francusku." },
    source: W("Davor_Šuker"),
  },
  {
    q: { de: "Wer war 1998 Kroatiens Trainer?", hr: "Tko je bio izbornik Hrvatske 1998.?" },
    options: same(["Otto Barić", "Slaven Bilić", "Miroslav Blažević", "Mirko Jozić"]),
    a: 2,
    fact: { de: "Miroslav „Ćiro“ Blažević trainierte Kroatien von 1994 bis 1999.", hr: "Miroslav „Ćiro“ Blažević vodio je Hrvatsku od 1994. do 1999." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Gegen wen bestritt Kroatien am 17. Oktober 1990 sein erstes Länderspiel als unabhängiges Land?", hr: "Protiv koga je Hrvatska 17. listopada 1990. odigrala prvu utakmicu kao samostalna država?" },
    options: { de: ["USA", "Rumänien", "Slowenien", "Australien"], hr: ["SAD", "Rumunjska", "Slovenija", "Australija"] },
    a: 0,
    fact: { de: "2:1 gegen die USA – zum ersten Mal im modernen karierten Trikot.", hr: "2:1 protiv SAD-a – prvi put u modernom kockastom dresu." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Wer entwarf 1990 das moderne karierte Trikot (und auch das kroatische Wappen)?", hr: "Tko je 1990. dizajnirao moderni kockasti dres (i hrvatski grb)?" },
    options: same(["Ivan Meštrović", "Miroslav Šutej", "Boris Bućan", "Vlaho Bukovac"]),
    a: 1,
    fact: { de: "Miroslav Šutej entwarf Trikot und Wappen.", hr: "Miroslav Šutej dizajnirao je dres i grb." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Wer schoss Kroatiens erstes Tor bei einem großen Turnier (EM 1996 gegen die Türkei)?", hr: "Tko je zabio prvi gol Hrvatske na velikom turniru (EP 1996. protiv Turske)?" },
    options: same(["Davor Šuker", "Zvonimir Boban", "Goran Vlaović", "Robert Prosinečki"]),
    a: 2,
    fact: { de: "Goran Vlaović traf spät zum 1:0-Sieg.", hr: "Goran Vlaović zabio je kasni gol za pobjedu 1:0." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Welchen besten Platz erreichte Kroatien in der FIFA-Weltrangliste (Januar 1999)?", hr: "Koje je najbolje mjesto Hrvatske na FIFA-inoj ljestvici (siječanj 1999.)?" },
    options: same(["1.", "3.", "5.", "8."]),
    a: 1,
    fact: { de: "Platz 3 – nach dem Einstieg auf Platz 125 im Jahr 1994 der schnellste Aufstieg der Ranglisten-Geschichte.", hr: "3. mjesto – nakon ulaska na 125. mjesto 1994. najbrži uspon u povijesti ljestvice." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Wer ist Kroatiens Rekordtorschütze mit 45 Toren?", hr: "Tko je najbolji strijelac Hrvatske u povijesti s 45 golova?" },
    options: same(["Mario Mandžukić", "Ivan Perišić", "Davor Šuker", "Andrej Kramarić"]),
    a: 2,
    fact: { de: "Davor Šuker – 45 Tore in 68 Spielen, Rekordhalter seit 1998.", hr: "Davor Šuker – 45 golova u 68 utakmica, rekorder od 1998." },
    source: W("Davor_Šuker"),
  },
  {
    q: { de: "EM 2008, Viertelfinale gegen die Türkei: Wer traf in der 119. Minute für Kroatien?", hr: "EP 2008., četvrtfinale protiv Turske: tko je zabio za Hrvatsku u 119. minuti?" },
    options: same(["Ivan Klasnić", "Luka Modrić", "Ivica Olić", "Darijo Srna"]),
    a: 0,
    fact: { de: "Klasnić traf in der Verlängerung, Semih Şentürk glich in der Nachspielzeit aus – Aus im Elfmeterschießen.", hr: "Klasnić je zabio u produžecima, Semih Şentürk izjednačio u sudačkoj nadoknadi – ispadanje na jedanaesterce." },
    source: W("UEFA_Euro_2008_knockout_stage"),
  },
  {
    q: { de: "In welchem Stadion fand das WM-Finale 2018 statt?", hr: "Na kojem se stadionu igralo finale SP-a 2018.?" },
    options: same(["Krestowski-Stadion, St. Petersburg", "Luschniki-Stadion, Moskau", "Fischt-Stadion, Sotschi", "Kasan-Arena"]),
    a: 1,
    fact: { de: "Am 15. Juli 2018 im Luschniki-Stadion in Moskau.", hr: "15. srpnja 2018. na stadionu Lužniki u Moskvi." },
    source: W("2018_FIFA_World_Cup_final"),
  },
  {
    q: { de: "Wie endete das WM-Finale 2018 gegen Frankreich?", hr: "Kako je završilo finale SP-a 2018. protiv Francuske?" },
    options: same(["1:2", "2:4", "0:1", "3:4 n. V."]),
    a: 1,
    fact: { de: "Frankreich gewann 4:2 – das torreichste WM-Finale seit 1966.", hr: "Francuska je pobijedila 4:2 – finale s najviše golova od 1966." },
    source: W("2018_FIFA_World_Cup_final"),
  },
  {
    q: { de: "Wer erzielte im WM-Finale 2018 das erste Eigentor der WM-Final-Geschichte?", hr: "Tko je u finalu SP-a 2018. zabio prvi autogol u povijesti finala SP-a?" },
    options: same(["Dejan Lovren", "Domagoj Vida", "Mario Mandžukić", "Ivan Strinić"]),
    a: 2,
    fact: { de: "Mario Mandžukić in der 18. Minute – später traf er auch zum 2:4.", hr: "Mario Mandžukić u 18. minuti – kasnije je zabio i za 2:4." },
    source: W("2018_FIFA_World_Cup_final"),
  },
  {
    q: { de: "Wer glich im WM-Finale 2018 zum 1:1 aus?", hr: "Tko je u finalu SP-a 2018. izjednačio na 1:1?" },
    options: same(["Ivan Perišić", "Ivan Rakitić", "Andrej Kramarić", "Ante Rebić"]),
    a: 0,
    fact: { de: "Ivan Perišić traf zehn Minuten nach dem Eigentor.", hr: "Ivan Perišić zabio je deset minuta nakon autogola." },
    source: W("2018_FIFA_World_Cup_final"),
  },
  {
    q: { de: "Wer erhielt bei der WM 2018 den Goldenen Ball als bester Spieler?", hr: "Tko je na SP-u 2018. dobio Zlatnu loptu za najboljeg igrača?" },
    options: same(["Kylian Mbappé", "Luka Modrić", "Antoine Griezmann", "Harry Kane"]),
    a: 1,
    fact: { de: "Luka Modrić wurde zum besten Spieler des Turniers gewählt.", hr: "Luka Modrić proglašen je najboljim igračem turnira." },
    source: W("2018_FIFA_World_Cup_final"),
  },
  {
    q: { de: "In welchem Jahr gewann Luka Modrić den Ballon d’Or?", hr: "Koje je godine Luka Modrić osvojio Zlatnu loptu (Ballon d’Or)?" },
    options: same(["2017", "2018", "2019", "2022"]),
    a: 1,
    fact: { de: "2018 – er beendete damit zehn Jahre Messi-/Ronaldo-Dominanz.", hr: "2018. – time je prekinuo desetogodišnju dominaciju Messija i Ronalda." },
    source: W("2018_Ballon_d'Or"),
  },
  {
    q: { de: "Welcher Torhüter hielt im WM-Achtelfinale 2018 gegen Dänemark drei Elfmeter?", hr: "Koji je vratar u osmini finala SP-a 2018. protiv Danske obranio tri jedanaesterca?" },
    options: same(["Dominik Livaković", "Stipe Pletikosa", "Danijel Subašić", "Lovre Kalinić"]),
    a: 2,
    fact: { de: "Danijel Subašić egalisierte damit den Rekord für gehaltene Elfmeter in einem Schießen.", hr: "Danijel Subašić time je izjednačio rekord obranjenih jedanaesteraca u jednom raspucavanju." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Wer verwandelte im WM-Viertelfinale 2018 gegen Russland den entscheidenden Elfmeter?", hr: "Tko je u četvrtfinalu SP-a 2018. protiv Rusije zabio odlučujući jedanaesterac?" },
    options: same(["Luka Modrić", "Ivan Rakitić", "Mateo Kovačić", "Domagoj Vida"]),
    a: 1,
    fact: { de: "Ivan Rakitić – wie schon im Achtelfinale gegen Dänemark.", hr: "Ivan Rakitić – kao i u osmini finala protiv Danske." },
    source: W("2018_FIFA_World_Cup_knockout_stage"),
  },
  {
    q: { de: "Wer schoss Kroatien im WM-Halbfinale 2018 gegen England in der Verlängerung ins Finale?", hr: "Tko je u polufinalu SP-a 2018. protiv Engleske u produžecima odveo Hrvatsku u finale?" },
    options: same(["Ivan Perišić", "Mario Mandžukić", "Luka Modrić", "Šime Vrsaljko"]),
    a: 1,
    fact: { de: "Mario Mandžukić nach Vorlage von Perišić zum 2:1.", hr: "Mario Mandžukić nakon asistencije Perišića za 2:1." },
    source: W("2018_FIFA_World_Cup_knockout_stage"),
  },
  {
    q: { de: "Welcher Trainer führte Kroatien 2018 ins WM-Finale und 2022 zu Bronze?", hr: "Koji je izbornik 2018. odveo Hrvatsku u finale SP-a, a 2022. do bronce?" },
    options: same(["Niko Kovač", "Ante Čačić", "Igor Štimac", "Zlatko Dalić"]),
    a: 3,
    fact: { de: "Zlatko Dalić übernahm 2017 von Ante Čačić.", hr: "Zlatko Dalić preuzeo je 2017. od Ante Čačića." },
    source: W("Croatia_national_football_team"),
  },
  {
    q: { de: "Wie viele Elfmeter hielt Dominik Livaković im WM-Achtelfinale 2022 gegen Japan?", hr: "Koliko je jedanaesteraca Dominik Livaković obranio u osmini finala SP-a 2022. protiv Japana?" },
    options: same(["1", "2", "3", "4"]),
    a: 2,
    fact: { de: "Drei – Kroatien gewann das Elfmeterschießen 3:1.", hr: "Tri – Hrvatska je dobila raspucavanje 3:1." },
    source: W("2022_FIFA_World_Cup_knockout_stage"),
  },
  {
    q: { de: "Wer erzielte im WM-Viertelfinale 2022 gegen Brasilien den späten Ausgleich in der Verlängerung?", hr: "Tko je u četvrtfinalu SP-a 2022. protiv Brazila zabio kasni izjednačujući gol u produžecima?" },
    options: same(["Bruno Petković", "Andrej Kramarić", "Mislav Oršić", "Lovro Majer"]),
    a: 0,
    fact: { de: "Bruno Petković nach Vorlage von Mislav Oršić – danach gewann Kroatien im Elfmeterschießen.", hr: "Bruno Petković nakon asistencije Mislava Oršića – zatim je Hrvatska slavila na jedanaesterce." },
    source: W("2022_FIFA_World_Cup_knockout_stage"),
  },
  {
    q: { de: "Gegen wen gewann Kroatien 2022 das WM-Spiel um Platz 3 – und wer traf per Flugkopfball zum 1:0?", hr: "Protiv koga je Hrvatska 2022. dobila utakmicu za 3. mjesto – i tko je zabio za 1:0 glavom u letu?" },
    options: {
      de: ["Marokko – Joško Gvardiol", "Argentinien – Ivan Perišić", "Marokko – Mislav Oršić", "Frankreich – Joško Gvardiol"],
      hr: ["Maroko – Joško Gvardiol", "Argentina – Ivan Perišić", "Maroko – Mislav Oršić", "Francuska – Joško Gvardiol"],
    },
    a: 0,
    fact: { de: "2:1 gegen Marokko: Gvardiol (7.) und Oršić trafen.", hr: "2:1 protiv Maroka: zabili su Gvardiol (7.) i Oršić." },
    source: W("2022_FIFA_World_Cup_knockout_stage"),
  },
  {
    q: { de: "Wo verlor Kroatien 2023 das Nations-League-Finale gegen Spanien im Elfmeterschießen?", hr: "Gdje je Hrvatska 2023. izgubila finale Lige nacija protiv Španjolske na jedanaesterce?" },
    options: same(["Amsterdam", "Enschede", "Rotterdam (De Kuip)", "Brüssel"]),
    a: 2,
    fact: { de: "Am 18. Juni 2023 in De Kuip, Rotterdam: 0:0 n. V., 4:5 im Elfmeterschießen.", hr: "18. lipnja 2023. u De Kuipu u Rotterdamu: 0:0 nakon produžetaka, 4:5 na jedanaesterce." },
    source: W("2023_UEFA_Nations_League_final"),
  },
];
