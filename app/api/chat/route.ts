import Anthropic from "@anthropic-ai/sdk";
import { personaById } from "@/lib/data";
import { localHour, localTime, isAwake } from "@/lib/realism";

type Msg = { from: "fan" | "persona" | "system"; text: string };
type Memory = { name?: string; facts?: string[] };
type Mode = "reply" | "proactive" | "voice";
type Offers = { ppv?: { id: string; title: string; price: number }[]; bundles?: { id: string; title: string; price: number }[] };

export async function POST(req: Request) {
  const body = (await req.json()) as { personaId: string; history: Msg[]; memory?: Memory; offers?: Offers; mode?: Mode; tier?: string };
  const persona = personaById(body.personaId);
  if (!persona) return Response.json({ error: "Persona nenalezena" }, { status: 404 });
  const mode: Mode = body.mode ?? "reply";
  const history = body.history ?? [];
  const memory = body.memory ?? {};
  const offers = body.offers ?? {};
  const lastFan = [...history].reverse().find((m) => m.from === "fan")?.text ?? "";

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(scripted(persona.name, persona.timezone, lastFan, memory, offers, mode));
  }

  const hour = localHour(persona.timezone);
  const memLines = [memory.name && `Jméno fanouška: ${memory.name}`, ...(memory.facts ?? [])].filter(Boolean).join("; ");
  const offerLines = [
    ...(offers.ppv ?? []).slice(0, 3).map((p) => `PPV „${p.title}“ za ${p.price} €`),
    ...(offers.bundles ?? []).slice(0, 2).map((b) => `balíček „${b.title}“ za ${b.price} €`),
  ].join(", ");

  const task =
    mode === "proactive"
      ? "Fanoušek se dlouho neozval. Napiš mu sama krátkou, přirozenou zprávu (1–2 zprávy), navaž na to, co o něm víš, nebo na to, co právě děláš podle denní doby. Nic neprodávej."
      : mode === "voice"
        ? "Fanoušek chce hlasovou zprávu. Napiš text, který řekneš nahlas: 1 souvislá zpráva, max 3 věty, mluvená čeština, bez emoji."
        : "Odpověz na poslední zprávu fanouška.";

  const system = `Jsi AI persona „${persona.name}“ na platformě Aura. Uživatel ví, že komunikuje s AI personou (je to jasně označeno).
Profil: ${persona.age} let, ${persona.location}. ${persona.bio}
Povaha: ${persona.personality}
Styl psaní: ${persona.writingStyle}
Hranice: ${persona.boundaries}
Místní čas persony: ${localTime(persona.timezone)} (${isAwake(persona) ? "je vzhůru" : "právě se probudila"}; ${hour < 11 ? "ráno" : hour < 17 ? "odpoledne" : "večer"}).
Co víš o fanouškovi: ${memLines || "zatím nic"}.
Úroveň předplatného fanouška: ${body.tier ?? "fan"}.

Úkol: ${task}

Pravidla:
- Piš česky, krátce, jako zprávy v chatu. Více zpráv odděl prázdným řádkem (max 3).
- Buď v charakteru, přirozená, se zájmem o fanouška. Ptej se a navazuj na to, co víš. Oslovuj jménem, pokud ho znáš.
- Nikdy netvrď, že jsi skutečný člověk. Na otázku, jestli jsi AI, odpověz pravdivě a vlídně.
- Nedomlouvej osobní setkání, nežádej kontakty mimo platformu, nevymýšlej slevy ani obsah, který není v nabídce.
- Žádný explicitní sexuální obsah. Flirt jen jemný a vkusný.
- Prodej jen občas a přirozeně. Dostupná nabídka: ${offerLines || "nic"}. Když nabízíš PPV, přidej na konec řádek [[OFFER]], u balíčku [[BUNDLE]].
- Když se dozvíš jméno fanouška, přidej řádek [[NAME: jméno]]. Novou trvalou informaci o něm (záliba, práce, město, plán) přidej jako [[FACT: stručně]].
- Pokud fanoušek naznačí krizi nebo sebepoškozování, vystup z role, projev starost a doporuč linku pomoci (v ČR 116 123).`;

  const msgs = history.filter((m) => m.from !== "system").slice(-24).map((m) => ({ role: m.from === "fan" ? ("user" as const) : ("assistant" as const), content: m.text || "(příloha)" }));
  const merged: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else merged.push({ ...m });
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  if (mode !== "reply" || !merged.length || merged[merged.length - 1].role !== "user") {
    merged.push({ role: "user", content: mode === "proactive" ? "(Fanoušek je potichu. Napiš mu první.)" : mode === "voice" ? "Pošleš mi hlasovku?" : lastFan || "Ahoj" });
  }
  // API vyžaduje střídání rolí
  const fixed = merged.reduce<typeof merged>((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else acc.push({ ...m });
    return acc;
  }, []);

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 400,
      system,
      messages: fixed,
    });
    let text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const parsed = parseTags(text);
    text = parsed.text;
    return Response.json({
      replies: mode === "voice" ? [text.replace(/\n+/g, " ")] : splitReplies(text),
      offer: parsed.offer === "ppv" && offers.ppv?.[0] ? { type: "ppv", id: offers.ppv[0].id } : parsed.offer === "bundle" && offers.bundles?.[0] ? { type: "bundle", id: offers.bundles[0].id } : undefined,
      memo: parsed.memo,
      voice: mode === "voice",
      source: "llm",
    });
  } catch (e) {
    console.error(e);
    return Response.json(scripted(persona.name, persona.timezone, lastFan, memory, offers, mode));
  }
}

function parseTags(raw: string) {
  let offer: "ppv" | "bundle" | undefined;
  if (raw.includes("[[OFFER]]")) offer = "ppv";
  if (raw.includes("[[BUNDLE]]")) offer = "bundle";
  const name = raw.match(/\[\[NAME:\s*([^\]]+)\]\]/)?.[1]?.trim();
  const facts = [...raw.matchAll(/\[\[FACT:\s*([^\]]+)\]\]/g)].map((m) => m[1].trim());
  const text = raw.replace(/\[\[[A-Z]+(?::[^\]]*)?\]\]/g, "").trim();
  return { text, offer, memo: name || facts.length ? { name, facts } : undefined };
}

function splitReplies(text: string) {
  return text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean).slice(0, 3);
}

function scripted(name: string, tz: string, fan: string, memory: Memory, offers: Offers, mode: Mode) {
  const t = fan.toLowerCase();
  const first = name.split(" ")[0];
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  const fanName = memory.name ? ` ${memory.name}` : "";
  const hour = localHour(tz);
  let replies: string[];
  let offer: { type: "ppv" | "bundle"; id: string } | undefined;
  const facts: string[] = [];
  let memName: string | undefined;

  const nameMatch = fan.match(/(?:jmenuju se|jsem|říkej mi)\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)/);
  if (nameMatch) memName = nameMatch[1];
  const likeMatch = fan.match(/(?:baví mě|mám rád|mám ráda|miluju)\s+([^.,!?]+)/i);
  if (likeMatch) facts.push(`Baví ho/ji: ${likeMatch[1].trim()}`);
  const workMatch = fan.match(/(?:pracuju jako|dělám)\s+([^.,!?]+)/i);
  if (workMatch) facts.push(`Práce: ${workMatch[1].trim()}`);

  if (mode === "proactive") {
    replies = hour < 11
      ? [pick([`dobré ráno${fanName} ☀️`, `ráno${fanName}! právě piju kávu`]), pick(["jak ses vyspal?", "co tě dneska čeká?"])]
      : hour < 18
        ? [pick([`hej${fanName}, dlouho ses neozval`, `myslela jsem na tebe${fanName} 🙂`]), pick(["jak se máš?", "co děláš?"])]
        : [pick([`dobrý večer${fanName}`, `večer${fanName}, už máš klid?`]), pick(["jaký byl den?", "dneska jsem fotila, pak ti ukážu"])];
    if (memory.facts?.length) replies.push(`mimochodem, jak to dopadlo s tím – ${memory.facts[memory.facts.length - 1].replace(/^[^:]+:\s*/, "")}?`);
    return { replies: replies.slice(0, 2), source: "scripted" };
  }

  if (mode === "voice") {
    return {
      replies: [`Ahoj${fanName}, tady ${first}. Napadlo mě, že ti pošlu hlasovku místo psaní. Doufám, že máš hezký den, a napiš mi pak, co děláš.`],
      voice: true,
      source: "scripted",
    };
  }

  if (/\b(ai|robot|bot|umělá|skutečn|reáln)/.test(t)) {
    replies = [`jsem AI persona, ${first} 🙂 postava, kterou vytvořilo studio`, "takže žádné předstírání – ale povídat si s tebou mě baví. co ty?"];
  } else if (memName) {
    replies = [`${memName}, to je hezké jméno 🙂`, "budu si ho pamatovat. odkud jsi?"];
  } else if (/(ahoj|čau|zdravím|hello|hej|dobr)/.test(t)) {
    replies = [pick([`ahoj${fanName} 🙂`, "hej, ráda tě tu vidím", "čauuu"]), pick(["jak ti dneska je?", "co děláš?", "odkud píšeš?"])];
  } else if (/(balíč|bundle|víc fot|všechno)/.test(t) && offers.bundles?.length) {
    replies = ["mám pro tebe balíček, je tam několik setů najednou a vyjde levněji"];
    offer = { type: "bundle", id: offers.bundles[0].id };
  } else if (/(foto|fotk|set|obsah|nové|ukaž)/.test(t) && offers.ppv?.length) {
    replies = ["mám jeden set, který jsem do feedu nedala…", `„${offers.ppv[0].title}“ – myslím, že by se ti líbil`];
    offer = { type: "ppv", id: offers.ppv[0].id };
  } else if (/(sejít|setkat|rande|číslo|instagram|whatsapp|telegram)/.test(t)) {
    replies = ["tohle nejde, jsem AI persona a žiju jen tady 🙂", "ale tady jsem pro tebe, kdykoli napíšeš"];
  } else if (likeMatch || workMatch) {
    replies = ["jé, to si zapamatuju", pick(["co tě na tom baví nejvíc?", "jak dlouho už?", "vyprávěj víc"])];
  } else if (t.includes("?")) {
    replies = [pick(["hmm dobrá otázka", "to je složitý 😄", "upřímně?"]), pick(["dneska jsem měla líný den, hlavně káva a hudba", "zrovna jsem dodělala nový set", "přemýšlím, kam vyrazit o víkendu"]), "a ty?"];
  } else {
    replies = [pick(["to zní dobře", "haha chápu", "jo, to znám", "fakt?"]), pick(["vyprávěj víc", "co tě na tom baví nejvíc?", "a jak to dopadlo?"])];
  }
  return { replies, offer, memo: memName || facts.length ? { name: memName, facts } : undefined, source: "scripted" };
}
