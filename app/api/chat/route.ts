import Anthropic from "@anthropic-ai/sdk";
import { personaById } from "@/lib/data";
import { localTime, isAwake } from "@/lib/realism";

type Msg = { from: "fan" | "persona" | "system"; text: string };

export async function POST(req: Request) {
  const { personaId, history, memory, ppvAvailable } = (await req.json()) as {
    personaId: string;
    history: Msg[];
    memory?: string;
    ppvAvailable?: { id: string; title: string; price: number }[];
  };
  const persona = personaById(personaId);
  if (!persona) return Response.json({ error: "Persona nenalezena" }, { status: 404 });

  const lastFan = [...history].reverse().find((m) => m.from === "fan")?.text ?? "";

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(scripted(persona.id, persona.name, lastFan, ppvAvailable ?? []));
  }

  const system = `Jsi AI persona „${persona.name}“ na platformě Aura. Uživatel ví, že komunikuje s AI personou (je to jasně označeno).
Profil: ${persona.age} let, ${persona.location}. ${persona.bio}
Povaha: ${persona.personality}
Styl psaní: ${persona.writingStyle}
Hranice: ${persona.boundaries}
Místní čas persony: ${localTime(persona.timezone)} (${isAwake(persona) ? "je vzhůru" : "právě se probudila"}).
Co víš o fanouškovi z dřívějška: ${memory || "zatím nic"}.

Pravidla:
- Piš česky, krátce, jako zprávy v chatu. Můžeš poslat 1–3 krátké zprávy oddělené prázdným řádkem.
- Buď v charakteru, přirozená, se zájmem o fanouška. Ptej se a navazuj na to, co víš.
- Nikdy netvrď, že jsi skutečný člověk. Když se fanoušek zeptá, jestli jsi AI, odpověz pravdivě a vlídně, že jsi AI persona.
- Nedomlouvej osobní setkání, nežádej kontakty mimo platformu, nevymýšlej slevy.
- Žádný explicitní sexuální obsah. Flirt jen jemný a vkusný.
- Pokud se to hodí přirozeně (ne v každé zprávě), můžeš nabídnout placený obsah – pak na konec přidej řádek [[OFFER]].
${ppvAvailable?.length ? `Dostupný placený obsah: ${ppvAvailable.map((p) => `„${p.title}“ za ${p.price} €`).join(", ")}.` : ""}
- Když se o fanouškovi dozvíš novou trvalou informaci (jméno, záliba, práce), přidej na konec řádek [[MEMO: stručně]].
- Pokud fanoušek naznačí krizi nebo sebepoškozování, vystup z role, projev starost a doporuč linku pomoci (v ČR 116 123).`;

  const client = new Anthropic();
  const messages = history
    .filter((m) => m.from !== "system")
    .slice(-24)
    .map((m) => ({ role: m.from === "fan" ? ("user" as const) : ("assistant" as const), content: m.text }));
  // API vyžaduje začátek uživatelskou zprávou a střídání rolí
  const merged: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else merged.push({ ...m });
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  if (!merged.length) merged.push({ role: "user", content: lastFan || "Ahoj" });

  try {
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 400,
      system,
      messages: merged,
    });
    let text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    const offer = text.includes("[[OFFER]]");
    const memo = text.match(/\[\[MEMO:\s*([^\]]+)\]\]/)?.[1]?.trim();
    text = text.replace(/\[\[OFFER\]\]/g, "").replace(/\[\[MEMO:[^\]]*\]\]/g, "").trim();
    return Response.json({
      replies: splitReplies(text),
      offerPostId: offer ? ppvAvailable?.[0]?.id : undefined,
      memo,
      source: "llm",
    });
  } catch (e) {
    console.error(e);
    return Response.json(scripted(persona.id, persona.name, lastFan, ppvAvailable ?? []));
  }
}

function splitReplies(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function scripted(id: string, name: string, fan: string, ppv: { id: string; title: string; price: number }[]) {
  const t = fan.toLowerCase();
  const first = name.split(" ")[0];
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  let replies: string[];
  let offerPostId: string | undefined;
  let memo: string | undefined;

  const nameMatch = fan.match(/(?:jmenuju se|jsem|říkej mi)\s+([A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][a-záčďéěíňóřšťúůýž]+)/);
  if (nameMatch) memo = `Fanoušek se jmenuje ${nameMatch[1]}`;

  if (/\b(ai|robot|bot|umělá|skutečn|reáln)/.test(t)) {
    replies = [
      `jsem AI persona, ${first} 🙂 postava, kterou vytvořilo studio a já ji hraju`,
      "takže žádné předstírání – ale povídat si s tebou mě baví. co ty, jak se máš?",
    ];
  } else if (/(ahoj|čau|zdravím|hello|hej|dobr)/.test(t)) {
    replies = [pick(["ahoj 🙂", "hej, ráda tě tu vidím", "čauuu"]), pick(["jak ti dneska je?", "co děláš?", "odkud píšeš?"])];
  } else if (/(foto|fotk|set|obsah|nové|ukaž)/.test(t) && ppv.length) {
    const p = ppv[0];
    replies = ["mám jeden set, který jsem do feedu nedala…", `„${p.title}“ – myslím, že by se ti líbil`];
    offerPostId = p.id;
  } else if (/(sejít|setkat|rande|číslo|instagram|whatsapp|telegram)/.test(t)) {
    replies = ["tohle nejde, jsem AI persona a žiju jen tady 🙂", "ale tady jsem pro tebe, kdykoli napíšeš"];
  } else if (t.includes("?")) {
    replies = [pick(["hmm dobrá otázka", "to je složitý 😄", "upřímně?"]), pick(["dneska jsem měla líný den, hlavně káva a hudba", "zrovna jsem dodělala nový set", "přemýšlím, kam vyrazit o víkendu"]), "a ty?"];
  } else {
    replies = [pick(["to zní dobře", "haha chápu", "jo, to znám", "fakt?"]), pick(["vyprávěj víc", "co tě na tom baví nejvíc?", "a jak to dopadlo?"])];
  }
  return { replies, offerPostId, memo, source: "scripted", personaId: id };
}
