import type { Lang } from "./i18n";
import type { Fact } from "./innovation-i18n";

/** Texte für "Musik & Film" – jede Aussage aus der verlinkten Wikipedia-Seite (geprüft am 25.10.2026). */
const W = (l: string, p: string) => `https://${l}.wikipedia.org/wiki/${p}`;

const DE = {
  metaTitle: "Musik & Film aus Kroatien – Stars, Festivals, Eurovision",
  metaDesc: "Aktuelle Schlagzeilen über kroatische Musiker, Schauspieler, Filme und Festivals – dazu offizielle Videos, Fakten und ein Künstler-Spotlight.",
  nav: "Musik & Film",
  h1: "Musik & Film",
  intro: "Kroatiens Stars auf Bühne und Leinwand: Musik, Schauspiel, Filme, Festivals und Eurovision. Schlagzeilen aus deutschsprachigen Medien, jeweils mit Link zum Original.",
  news: "Aktuelle Schlagzeilen",
  newsNote: "Quelle: Google News (deutschsprachige Medien). Höchstens 2 Meldungen pro Person oder Festival, gleiche Geschichte nur einmal. Klatsch, Kriminalität, Politik und Sport sind ausgeblendet.",
  sources: "Google News",
  none: "Gerade keine passenden Meldungen gefunden.",
  videos: "Videos",
  videosNote: "Je das neueste Video der offiziellen YouTube-Kanäle von Baby Lasagna, HAUSER, Luka Šulić, MAKSIM, INmusic und dem Filmfestival Pula. Das Video wird erst nach Klick von youtube-nocookie.com geladen.",
  load: "Video laden",
  did: "Wusstest du?",
  didNote: "Kroatische Momente der Musik- und Filmgeschichte – jeweils mit Quelle.",
  spot: "Künstler-Spotlight",
  source: "Quelle",
  teaser: "Kroatische Stars, Filme, Festivals und Eurovision",
  facts: [
    { emoji: "🏆", title: "Oscar aus Zagreb", text: "Der Zeichentrickfilm „Surogat“ (Ersatz) von Dušan Vukotić, produziert von Zagreb Film, gewann 1962 den Oscar als bester animierter Kurzfilm.", url: W("en", "Surogat") },
    { emoji: "🎬", title: "Zwei Oscars", text: "Produzent Branko Lustig aus Osijek gewann Oscars für „Schindlers Liste“ und „Gladiator“ – als einziger in Kroatien Geborener mit zwei Oscars.", url: W("en", "Branko_Lustig") },
    { emoji: "🏛️", title: "Kino in der Arena", text: "Das Filmfestival von Pula gibt es seit 1954 – gezeigt wird im römischen Amphitheater, der Arena von Pula.", url: W("en", "Pula_Film_Festival") },
    { emoji: "🎤", title: "Rekord beim ESC", text: "Baby Lasagna wurde 2024 mit „Rim Tim Tagi Dim“ Zweiter, gewann das Publikumsvoting und holte mit 547 Punkten Kroatiens bestes Ergebnis.", url: W("en", "Baby_Lasagna") },
    { emoji: "🎻", title: "Viral mit Cello", text: "2Cellos wurden 2011 mit ihrer Cello-Version von „Smooth Criminal“ auf YouTube berühmt – danach holte sie Elton John auf seine Tour.", url: W("en", "2Cellos") },
    { emoji: "🎸", title: "Festival am See", text: "Das INmusic festival findet seit 2006 auf einer Insel im Zagreber Jarun-See statt; The Times zählte es 2008 zu Europas 20 besten Sommerfestivals.", url: W("en", "INmusic_Festival") },
  ] as Fact[],
  people: [
    { emoji: "🎤", title: "Baby Lasagna", text: "Sänger und Produzent Marko Purišić, Gründungsmitglied der Band Manntra, ESC-Zweiter 2024.", url: W("de", "Baby_Lasagna") },
    { emoji: "🎻", title: "Luka Šulić & Stjepan Hauser", text: "Die Cellisten von 2Cellos: sechs Alben bei Sony Masterworks, heute beide als Solokünstler aktiv.", url: W("de", "2Cellos") },
    { emoji: "🎹", title: "Maksim Mrvica", text: "Pianist aus Šibenik, spielt Classical Crossover.", url: W("de", "Maksim_Mrvica") },
    { emoji: "🩺", title: "Goran Višnjić", text: "Schauspieler aus Šibenik, bekannt als Dr. Luka Kovač in „Emergency Room“.", url: W("en", "Goran_Višnjić") },
    { emoji: "🎭", title: "Rade Šerbedžija", text: "Vierfacher Gewinner der Goldenen Arena als bester Darsteller, international bekannt als Boris in „Snatch“.", url: W("en", "Rade_Šerbedžija") },
    { emoji: "🎶", title: "Oliver Dragojević", text: "Sänger und Komponist (1947–2018), eine Ikone der kroatischen Musik – mit Auftritten in der Carnegie Hall und der Royal Albert Hall.", url: W("en", "Oliver_Dragojević") },
  ] as Fact[],
};

const HR: typeof DE = {
  metaTitle: "Glazba i film iz Hrvatske – zvijezde, festivali, Eurovizija",
  metaDesc: "Najnoviji naslovi o hrvatskim glazbenicima, glumcima, filmovima i festivalima – uz službene videe, zanimljivosti i umjetnike u fokusu.",
  nav: "Glazba i film",
  h1: "Glazba i film",
  intro: "Hrvatske zvijezde na pozornici i platnu: glazba, gluma, filmovi, festivali i Eurovizija. Naslovi hrvatskih medija, uvijek s poveznicom na izvornik.",
  news: "Najnoviji naslovi",
  newsNote: "Izvori: tportal, Večernji list, Muzika.hr, Index.hr i Google News. Najviše 2 vijesti po osobi ili festivalu, ista priča samo jednom. Tračevi, crna kronika, politika i sport nisu prikazani.",
  sources: "tportal, Večernji list, Muzika.hr, Index.hr, Google News",
  none: "Trenutačno nema odgovarajućih vijesti.",
  videos: "Videozapisi",
  videosNote: "Najnoviji video sa službenih YouTube kanala Baby Lasagne, HAUSER-a, Luke Šulića, MAKSIM-a, INmusica i Pulskog filmskog festivala. Video se s youtube-nocookie.com učitava tek nakon klika.",
  load: "Učitaj video",
  did: "Jeste li znali?",
  didNote: "Hrvatski trenuci glazbene i filmske povijesti – uz izvor.",
  spot: "Umjetnici u fokusu",
  source: "Izvor",
  teaser: "Hrvatske zvijezde, filmovi, festivali i Eurovizija",
  facts: [
    { emoji: "🏆", title: "Oscar iz Zagreba", text: "Crtani film „Surogat“ Dušana Vukotića u produkciji Zagreb filma osvojio je 1962. Oscara za najbolji animirani kratki film.", url: W("en", "Surogat") },
    { emoji: "🎬", title: "Dva Oscara", text: "Producent Branko Lustig iz Osijeka osvojio je Oscare za „Schindlerovu listu“ i „Gladijatora“ – jedini rođen na tlu današnje Hrvatske s dva Oscara.", url: W("hr", "Branko_Lustig") },
    { emoji: "🏛️", title: "Kino u Areni", text: "Pulski filmski festival održava se od 1954. u rimskom amfiteatru – pulskoj Areni.", url: W("hr", "Pulski_filmski_festival") },
    { emoji: "🎤", title: "Rekord na Euroviziji", text: "Baby Lasagna je 2024. s pjesmom „Rim Tim Tagi Dim“ bio drugi, pobijedio u glasovanju publike i s 547 bodova ostvario najbolji hrvatski rezultat.", url: W("hr", "Baby_Lasagna") },
    { emoji: "🎻", title: "Viralni violončelisti", text: "2Cellos su 2011. postali slavni na YouTubeu obradom „Smooth Criminal“ – nakon toga Elton John ih je poveo na turneju.", url: W("hr", "2Cellos") },
    { emoji: "🎸", title: "Festival na jezeru", text: "INmusic festival od 2006. održava se na otoku na zagrebačkom Jarunu; The Times ga je 2008. uvrstio među 20 najboljih europskih ljetnih festivala.", url: W("hr", "INmusic_festival") },
  ],
  people: [
    { emoji: "🎤", title: "Baby Lasagna", text: "Pjevač i producent Marko Purišić, jedan od osnivača benda Manntra, drugi na Euroviziji 2024.", url: W("hr", "Baby_Lasagna") },
    { emoji: "🎻", title: "Luka Šulić i Stjepan Hauser", text: "Violončelisti 2Cellos: šest albuma za Sony Masterworks, danas obojica nastupaju samostalno.", url: W("hr", "2Cellos") },
    { emoji: "🎹", title: "Maksim Mrvica", text: "Pijanist iz Šibenika, svira classical crossover.", url: W("hr", "Maksim_Mrvica") },
    { emoji: "🩺", title: "Goran Višnjić", text: "Glumac iz Šibenika, poznat kao dr. Luka Kovač u seriji „Hitna služba“ (ER).", url: W("hr", "Goran_Višnjić") },
    { emoji: "🎭", title: "Rade Šerbedžija", text: "Četverostruki dobitnik Zlatne arene za najboljeg glumca, svjetski poznat kao Boris u filmu „Snatch“.", url: W("hr", "Rade_Šerbedžija") },
    { emoji: "🎶", title: "Oliver Dragojević", text: "Pjevač i skladatelj (1947. – 2018.), ikona hrvatske glazbe – nastupao u Carnegie Hallu i Royal Albert Hallu.", url: W("hr", "Oliver_Dragojević") },
  ],
};

export const kultur = (lang: Lang) => (lang === "hr" ? HR : DE);
