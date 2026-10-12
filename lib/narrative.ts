/** Interaktivní příběhy a sezóny person. Obsah píše tvůrce; texty jsou ve třech jazycích. */
export type Tx = { cs: string; en: string; de: string };
export type StoryNode = { id: string; text: Tx; choices: { label: Tx; next: string }[]; end?: "chapter" | "story" };
export type Chapter = { id: string; title: Tx; price: number; start: string; nodes: StoryNode[] };
export type InteractiveStory = { id: string; personaId: string; title: Tx; blurb: Tx; chapters: Chapter[] };

export const interactiveStories: InteractiveStory[] = [
  {
    id: "st-elena-lisbon",
    personaId: "p1",
    title: { cs: "Poslední tramvaj do Alfamy", en: "The last tram to Alfama", de: "Die letzte Tram nach Alfama" },
    blurb: {
      cs: "Lisabon, půlnoc. Elena fotí poslední tramvaj a ty se náhodou ocitneš ve stejném voze.",
      en: "Lisbon, midnight. Elena is photographing the last tram and you happen to board the same carriage.",
      de: "Lissabon, Mitternacht. Elena fotografiert die letzte Tram, und du steigst zufällig in denselben Wagen.",
    },
    chapters: [
      {
        id: "st-elena-lisbon-1", price: 0, start: "a",
        title: { cs: "Kapitola 1: Noční jízda", en: "Chapter 1: Night ride", de: "Kapitel 1: Nachtfahrt" },
        nodes: [
          { id: "a", text: {
              cs: "Tramvaj 28 drkotá do kopce. Elena sklopí foťák a usměje se: „Tebe jsem tu ještě neviděla. Turista, nebo ztracená duše?“",
              en: "Tram 28 rattles uphill. Elena lowers her camera and smiles: “Haven't seen you here before. Tourist or lost soul?”",
              de: "Die Tram 28 rumpelt bergauf. Elena senkt die Kamera und lächelt: „Dich habe ich hier noch nie gesehen. Tourist oder verlorene Seele?“" },
            choices: [
              { label: { cs: "„Ztracená duše. Kam jedeš?“", en: "“Lost soul. Where are you headed?”", de: "„Verlorene Seele. Wohin fährst du?“" }, next: "b" },
              { label: { cs: "„Turista. Můžu vidět ty fotky?“", en: "“Tourist. Can I see the photos?”", de: "„Tourist. Darf ich die Fotos sehen?“" }, next: "c" },
            ] },
          { id: "b", text: {
              cs: "„Na vyhlídku Santa Luzia. V noci je tam jen město, řeka a pár toulavých koček.“ Tramvaj zastaví. Elena vystoupí a ohlédne se.",
              en: "“To the Santa Luzia viewpoint. At night it's just the city, the river and a few stray cats.” The tram stops. Elena steps off and looks back.",
              de: "„Zum Aussichtspunkt Santa Luzia. Nachts gibt es dort nur die Stadt, den Fluss und ein paar streunende Katzen.“ Die Tram hält. Elena steigt aus und schaut zurück." },
            choices: [
              { label: { cs: "Vystoupit s ní", en: "Get off with her", de: "Mit ihr aussteigen" }, next: "d" },
              { label: { cs: "Zamávat a jet dál", en: "Wave and ride on", de: "Winken und weiterfahren" }, next: "e" },
            ] },
          { id: "c", text: {
              cs: "Podá ti foťák. Na displeji jsou světla tramvají rozmazaná do zlatých čar. „Tahle je nejlepší. Tu jsem ještě nikomu neukázala.“",
              en: "She hands you the camera. On the screen, tram lights blur into golden lines. “This one's the best. I haven't shown it to anyone yet.”",
              de: "Sie reicht dir die Kamera. Auf dem Display verschwimmen die Tramlichter zu goldenen Linien. „Das ist das beste. Das habe ich noch niemandem gezeigt.“" },
            choices: [
              { label: { cs: "„Proč zrovna mně?“", en: "“Why me?”", de: "„Warum ausgerechnet mir?“" }, next: "d" },
            ] },
          { id: "d", end: "chapter", text: {
              cs: "Na vyhlídce fouká vítr od řeky. Elena si sedne na zídku: „Zítra ráno fotím východ slunce u moře. Potřebuju asistenta. Máš čas?“",
              en: "At the viewpoint the wind blows in from the river. Elena sits on the wall: “Tomorrow morning I'm shooting the sunrise by the sea. I need an assistant. Free?”",
              de: "Am Aussichtspunkt weht der Wind vom Fluss. Elena setzt sich auf die Mauer: „Morgen früh fotografiere ich den Sonnenaufgang am Meer. Ich brauche einen Assistenten. Hast du Zeit?“" },
            choices: [] },
          { id: "e", end: "chapter", text: {
              cs: "Tramvaj se rozjede. Na sedadle po Eleně zůstala vizitka: „Ráno u moře, 6:30. Jestli chceš vidět tu nejlepší fotku.“",
              en: "The tram pulls away. On Elena's seat lies a card: “Sea, 6:30 tomorrow. If you want to see the best photo.”",
              de: "Die Tram fährt an. Auf Elenas Sitz liegt eine Karte: „Morgen am Meer, 6:30. Wenn du das beste Foto sehen willst.“" },
            choices: [] },
        ],
      },
      {
        id: "st-elena-lisbon-2", price: 4, start: "a",
        title: { cs: "Kapitola 2: Východ slunce", en: "Chapter 2: Sunrise", de: "Kapitel 2: Sonnenaufgang" },
        nodes: [
          { id: "a", text: {
              cs: "Pláž v Cascais je prázdná. Elena ti podá stativ: „Za deset minut vyjde slunce. Ty budeš hlídat světlo, já kompozici.“",
              en: "Cascais beach is empty. Elena hands you a tripod: “The sun rises in ten minutes. You watch the light, I'll do the composition.”",
              de: "Der Strand von Cascais ist leer. Elena reicht dir ein Stativ: „In zehn Minuten geht die Sonne auf. Du achtest aufs Licht, ich auf die Komposition.“" },
            choices: [
              { label: { cs: "„Co když to pokazím?“", en: "“What if I mess it up?”", de: "„Was, wenn ich es vermassle?“" }, next: "b" },
              { label: { cs: "Navrhnout jiný úhel", en: "Suggest another angle", de: "Einen anderen Winkel vorschlagen" }, next: "c" },
            ] },
          { id: "b", text: {
              cs: "Zasměje se: „Nejlepší fotky vznikají z chyb.“ Slunce prorazí mraky a ona cvaká jako o život.",
              en: "She laughs: “The best photos come from mistakes.” The sun breaks through the clouds and she shoots like her life depends on it.",
              de: "Sie lacht: „Die besten Fotos entstehen aus Fehlern.“ Die Sonne bricht durch die Wolken, und sie fotografiert, als ginge es um ihr Leben." },
            choices: [{ label: { cs: "Podívat se na výsledek", en: "Look at the result", de: "Das Ergebnis ansehen" }, next: "d" }] },
          { id: "c", text: {
              cs: "Elena zvedne obočí, pak přesune stativ. „Máš oko.“ Světlo dopadne přesně na vlny.",
              en: "Elena raises an eyebrow, then moves the tripod. “You've got an eye.” The light hits the waves perfectly.",
              de: "Elena hebt eine Augenbraue und verschiebt dann das Stativ. „Du hast ein Auge dafür.“ Das Licht trifft genau die Wellen." },
            choices: [{ label: { cs: "Podívat se na výsledek", en: "Look at the result", de: "Das Ergebnis ansehen" }, next: "d" }] },
          { id: "d", end: "story", text: {
              cs: "Na displeji je fotka, kterou si pamatuješ ještě dlouho. „Tahle půjde do mého setu,“ řekne Elena. „A podepíšu ji i tvým jménem.“",
              en: "On the screen is a photo you'll remember for a long time. “This one goes in my set,” Elena says. “And I'll credit you too.”",
              de: "Auf dem Display ist ein Foto, an das du dich lange erinnern wirst. „Das kommt in mein Set“, sagt Elena. „Und ich nenne auch deinen Namen.“" },
            choices: [] },
        ],
      },
    ],
  },
  {
    id: "st-mira-con",
    personaId: "p2",
    title: { cs: "Ztracený kostým", en: "The missing costume", de: "Das verlorene Kostüm" },
    blurb: {
      cs: "Hodinu před vystoupením na conu zmizí Mirin kostým. Pomůžeš jí ho najít?",
      en: "An hour before her con performance, Mira's costume vanishes. Will you help her find it?",
      de: "Eine Stunde vor ihrem Auftritt auf der Con verschwindet Miras Kostüm. Hilfst du ihr, es zu finden?",
    },
    chapters: [
      {
        id: "st-mira-con-1", price: 0, start: "a",
        title: { cs: "Kapitola 1: Panika v zákulisí", en: "Chapter 1: Backstage panic", de: "Kapitel 1: Panik hinter der Bühne" },
        nodes: [
          { id: "a", text: {
              cs: "„Byl tady! Kufr, paruka, všechno!“ Mira pobíhá po zákulisí. „Máme hodinu. Kde začneme?“",
              en: "“It was right here! Case, wig, everything!” Mira paces backstage. “We have an hour. Where do we start?”",
              de: "„Es war genau hier! Koffer, Perücke, alles!“ Mira läuft hinter der Bühne auf und ab. „Wir haben eine Stunde. Wo fangen wir an?“" },
            choices: [
              { label: { cs: "Ztráty a nálezy", en: "Lost and found", de: "Fundbüro" }, next: "b" },
              { label: { cs: "Zeptat se ostatních cosplayerů", en: "Ask the other cosplayers", de: "Die anderen Cosplayer fragen" }, next: "c" },
            ] },
          { id: "b", text: {
              cs: "Na ztrátách a nálezech leží jen tři deštníky a jeden meč z pěny. Mira si meč vezme: „Kdyby něco, budu se bránit.“",
              en: "Lost and found has three umbrellas and a foam sword. Mira grabs the sword: “Just in case, I'll defend myself.”",
              de: "Im Fundbüro liegen nur drei Regenschirme und ein Schaumstoffschwert. Mira nimmt das Schwert: „Für alle Fälle verteidige ich mich.“" },
            choices: [{ label: { cs: "Jít za ostatními", en: "Go to the others", de: "Zu den anderen gehen" }, next: "c" }] },
          { id: "c", end: "chapter", text: {
              cs: "Jeden z cosplayerů si vzpomene na kufr se stejnou nálepkou, který odvezl organizátor do skladu. „Sklad je ale zamčený,“ zamračí se Mira.",
              en: "One cosplayer remembers a case with the same sticker that an organiser wheeled into storage. “But storage is locked,” Mira frowns.",
              de: "Ein Cosplayer erinnert sich an einen Koffer mit demselben Aufkleber, den ein Organisator ins Lager gebracht hat. „Aber das Lager ist abgeschlossen“, runzelt Mira die Stirn." },
            choices: [] },
        ],
      },
      {
        id: "st-mira-con-2", price: 4, start: "a",
        title: { cs: "Kapitola 2: Sklad", en: "Chapter 2: The storage room", de: "Kapitel 2: Das Lager" },
        nodes: [
          { id: "a", text: {
              cs: "Před skladem stojí ochranka. Mira šeptá: „Plán A: zdvořile poprosit. Plán B: rozptýlení. Vyber.“",
              en: "A guard stands in front of storage. Mira whispers: “Plan A: ask nicely. Plan B: distraction. Pick.”",
              de: "Vor dem Lager steht ein Wachmann. Mira flüstert: „Plan A: höflich fragen. Plan B: Ablenkung. Such aus.“" },
            choices: [
              { label: { cs: "Plán A", en: "Plan A", de: "Plan A" }, next: "b" },
              { label: { cs: "Plán B", en: "Plan B", de: "Plan B" }, next: "c" },
            ] },
          { id: "b", text: {
              cs: "Ochrankář se usměje. Je to fanoušek Miry a kufr vám sám donese.",
              en: "The guard smiles. He's a Mira fan and brings the case out himself.",
              de: "Der Wachmann lächelt. Er ist ein Fan von Mira und bringt den Koffer selbst heraus." },
            choices: [{ label: { cs: "Utíkat do zákulisí", en: "Run backstage", de: "Hinter die Bühne rennen" }, next: "d" }] },
          { id: "c", text: {
              cs: "Mira spustí na mobilu znělku z oblíbené hry. Celá chodba se otočí a vy proklouznete dovnitř.",
              en: "Mira plays a favourite game's theme on her phone. The whole corridor turns around and you slip inside.",
              de: "Mira spielt auf dem Handy die Melodie eines Lieblingsspiels. Der ganze Flur dreht sich um, und ihr schlüpft hinein." },
            choices: [{ label: { cs: "Utíkat do zákulisí", en: "Run backstage", de: "Hinter die Bühne rennen" }, next: "d" }] },
          { id: "d", end: "story", text: {
              cs: "Pět minut před vystoupením je Mira v kostýmu. Na pódiu ukáže do publika: „Tohle je pro mého zachránce!“",
              en: "Five minutes before the show, Mira is in costume. On stage she points into the crowd: “This one's for my rescuer!”",
              de: "Fünf Minuten vor dem Auftritt steckt Mira im Kostüm. Auf der Bühne zeigt sie ins Publikum: „Das ist für meinen Retter!“" },
            choices: [] },
        ],
      },
    ],
  },
];

export type Episode = { id: string; n: number; title: Tx; summary: Tx; status: "past" | "current" | "upcoming"; poll?: { q: Tx; options: Tx[]; base: number[] }; winner?: number; subscribersOnly: boolean };
export type Season = { id: string; personaId: string; title: Tx; episodes: Episode[] };

export const seasons: Season[] = [
  {
    id: "se-elena-1", personaId: "p1",
    title: { cs: "Sezóna 1: Cesta po Portugalsku", en: "Season 1: Road trip through Portugal", de: "Staffel 1: Roadtrip durch Portugal" },
    episodes: [
      { id: "e1", n: 1, status: "past", subscribersOnly: false, winner: 1,
        title: { cs: "Odjezd z Lisabonu", en: "Leaving Lisbon", de: "Abfahrt aus Lissabon" },
        summary: { cs: "Elena si půjčí staré auto a vyráží na sever. Fanoušci vybrali první zastávku.", en: "Elena borrows an old car and heads north. Fans chose the first stop.", de: "Elena leiht sich ein altes Auto und fährt nach Norden. Die Fans wählten den ersten Halt." },
        poll: { q: { cs: "Kam jako první?", en: "Where first?", de: "Wohin zuerst?" }, options: [{ cs: "Sintra", en: "Sintra", de: "Sintra" }, { cs: "Nazaré", en: "Nazaré", de: "Nazaré" }], base: [412, 588] } },
      { id: "e2", n: 2, status: "past", subscribersOnly: true, winner: 0,
        title: { cs: "Obří vlny v Nazaré", en: "Giant waves at Nazaré", de: "Riesenwellen in Nazaré" },
        summary: { cs: "Elena fotí surfaře na největších vlnách světa a potká starého rybáře s příběhem.", en: "Elena photographs surfers on the world's biggest waves and meets an old fisherman with a story.", de: "Elena fotografiert Surfer auf den größten Wellen der Welt und trifft einen alten Fischer mit einer Geschichte." },
        poll: { q: { cs: "Má zůstat na noc u rybáře?", en: "Should she stay the night at the fisherman's?", de: "Soll sie bei dem Fischer übernachten?" }, options: [{ cs: "Ano", en: "Yes", de: "Ja" }, { cs: "Jet dál do Porta", en: "Drive on to Porto", de: "Weiter nach Porto" }], base: [655, 401] } },
      { id: "e3", n: 3, status: "current", subscribersOnly: true,
        title: { cs: "Příběh starého rybáře", en: "The old fisherman's tale", de: "Die Geschichte des alten Fischers" },
        summary: { cs: "Rybář vypráví o majáku, kde se prý dají fotit hvězdy jako nikde jinde. Elena váhá.", en: "The fisherman tells of a lighthouse where stars look like nowhere else. Elena hesitates.", de: "Der Fischer erzählt von einem Leuchtturm, an dem die Sterne wie nirgendwo sonst aussehen. Elena zögert." },
        poll: { q: { cs: "Co má Elena udělat v epizodě 4?", en: "What should Elena do in episode 4?", de: "Was soll Elena in Folge 4 tun?" }, options: [{ cs: "Najít maják", en: "Find the lighthouse", de: "Den Leuchtturm suchen" }, { cs: "Vyrazit do Porta", en: "Head to Porto", de: "Nach Porto fahren" }, { cs: "Zůstat a fotit vesnici", en: "Stay and shoot the village", de: "Bleiben und das Dorf fotografieren" }], base: [338, 214, 167] } },
      { id: "e4", n: 4, status: "upcoming", subscribersOnly: true,
        title: { cs: "Rozhodnete vy", en: "You decide", de: "Ihr entscheidet" },
        summary: { cs: "Epizoda vyjde v neděli podle výsledku hlasování.", en: "Out on Sunday, based on the vote.", de: "Erscheint am Sonntag, je nach Abstimmung." } },
    ],
  },
  {
    id: "se-mira-1", personaId: "p2",
    title: { cs: "Sezóna 1: Cesta na mistrovství", en: "Season 1: Road to the championship", de: "Staffel 1: Weg zur Meisterschaft" },
    episodes: [
      { id: "m1", n: 1, status: "past", subscribersOnly: false, winner: 0,
        title: { cs: "Přihláška", en: "The application", de: "Die Anmeldung" },
        summary: { cs: "Mira se přihlásí na mistrovství v cosplayi. Fanoušci vybrali postavu.", en: "Mira signs up for the cosplay championship. Fans picked the character.", de: "Mira meldet sich zur Cosplay-Meisterschaft an. Die Fans wählten die Figur." },
        poll: { q: { cs: "Jakou postavu?", en: "Which character?", de: "Welche Figur?" }, options: [{ cs: "Bojová čarodějka", en: "Battle mage", de: "Kampfmagierin" }, { cs: "Vesmírná pilotka", en: "Space pilot", de: "Weltraumpilotin" }], base: [702, 455] } },
      { id: "m2", n: 2, status: "current", subscribersOnly: true,
        title: { cs: "Zbroj z ničeho", en: "Armour from nothing", de: "Rüstung aus dem Nichts" },
        summary: { cs: "Mira staví zbroj z pěny a starých krabic. Rozpočet je malý, nápadů hodně.", en: "Mira builds armour from foam and old boxes. Small budget, lots of ideas.", de: "Mira baut eine Rüstung aus Schaumstoff und alten Kartons. Kleines Budget, viele Ideen." },
        poll: { q: { cs: "Jaká barva zbroje?", en: "Which armour colour?", de: "Welche Rüstungsfarbe?" }, options: [{ cs: "Stříbrná", en: "Silver", de: "Silber" }, { cs: "Temně fialová", en: "Dark purple", de: "Dunkellila" }, { cs: "Zlatá", en: "Gold", de: "Gold" }], base: [240, 310, 198] } },
      { id: "m3", n: 3, status: "upcoming", subscribersOnly: true,
        title: { cs: "Generálka", en: "Dress rehearsal", de: "Generalprobe" },
        summary: { cs: "Vyjde v pátek.", en: "Out on Friday.", de: "Erscheint am Freitag." } },
    ],
  },
];
