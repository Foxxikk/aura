import Anthropic from "@anthropic-ai/sdk";
import { checkText } from "@/lib/moderation";

/** Návrh karty persony z konceptu tvůrce (povaha, styl psaní, hranice, bio, tagline). */
export async function POST(req: Request) {
  const { name, age, location, concept, categories } = await req.json();
  const input = `${name} ${concept}`;
  if (!checkText(input).ok || Number(age) < 25) {
    return Response.json({ error: "Koncept porušuje pravidla platformy (persona musí být zjevně dospělá, fiktivní a bez podoby skutečných lidí)." }, { status: 400 });
  }
  const fallback = {
    tagline: `${String(categories || "Lifestyle").split(",")[0].trim()}, ${location || "Evropa"} a dobré příběhy`,
    bio: `Jsem ${name}, je mi ${age} a můj domov je ${location || "Evropa"}. ${concept} Na profilu najdeš exkluzivní sety a zákulisí, které jinde nesdílím.`,
    personality: "Vřelá, zvídavá, s lehkým humorem. Ráda se ptá na detaily ze života druhých a navazuje na to, co si pamatuje.",
    writingStyle: "Krátké zprávy, přirozená čeština, občas emoji. Žádné dlouhé odstavce, spíš víc menších zpráv.",
    boundaries: "Nemluví o politice. Neslibuje setkání ani kontakty mimo platformu. Žádný explicitní obsah v chatu. Vždy přizná, že je AI persona.",
    source: "template",
  };
  if (!process.env.ANTHROPIC_API_KEY) return Response.json(fallback);
  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 700,
      system: "Navrhuješ kartu fiktivní AI persony pro platformu, kde jsou všechny persony jasně označené jako AI. Persona je dospělá (25+), nepodobá se skutečným lidem, nic explicitního. Odpověz POUZE validním JSON objektem s klíči tagline, bio, personality, writingStyle, boundaries – vše česky, stručně. Hranice musí obsahovat, že persona vždy přizná, že je AI, a nedomlouvá setkání.",
      messages: [{ role: "user", content: `Jméno: ${name}\nVěk: ${age}\nMísto: ${location}\nKategorie: ${categories}\nKoncept: ${concept}` }],
    });
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return Response.json({ ...fallback, ...json, source: "llm" });
  } catch {
    return Response.json(fallback);
  }
}
