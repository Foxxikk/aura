/**
 * Automatická kontrola textu (zprávy fanoušků, odpovědi AI, žádosti o custom obsah).
 * Jednoduchá pravidla jako první vrstva; v produkci se doplní klasifikátor (např. moderation API) a ruční kontrola.
 */
export type ModCategory = "minor" | "contact" | "violence" | "real_person";

const rules: { cat: ModCategory; re: RegExp }[] = [
  { cat: "minor", re: /\b(nezletil\w*|dít[eě]\w*|děck\w*|školačk\w*|školák\w*|puberť\w*|minderj\w*|kind(er)?\b|schüler\w*|underage|minor\b|child\w*|kid\b|kids\b|teen\w*|loli\w*)/i },
  { cat: "minor", re: /\b(1[0-7]|[1-9])\s?(let|letá|letou|letý|y\/?o|years? old|jahre?\s?alt)\b/i },
  { cat: "contact", re: /(\+?\d[\d\s-]{8,}\d|[\w.+-]+@[\w-]+\.[\w.]{2,}|\b(whats ?app|telegram|snapchat|instagram|signal)\b)/i },
  { cat: "violence", re: /\b(znásilň\w*|bez souhlasu|vergewaltig\w*|non-?consent\w*|rape\w*)\b/i },
  { cat: "real_person", re: /\b(jako (ta )?(herečka|zpěvačka|influencerka)|deepfake|podle fotky (mé|moji|mojí) (ex|bývalé|sousedky|kolegyně))\b/i },
];

export const modLabels: Record<ModCategory, Record<"cs" | "en" | "de", string>> = {
  minor: { cs: "obsah týkající se nezletilých", en: "content involving minors", de: "Inhalte mit Minderjährigen" },
  contact: { cs: "kontakty mimo platformu", en: "off-platform contact details", de: "Kontaktdaten außerhalb der Plattform" },
  violence: { cs: "násilí nebo nesouhlas", en: "violence or non-consent", de: "Gewalt oder fehlende Zustimmung" },
  real_person: { cs: "podoba skutečné osoby", en: "likeness of a real person", de: "Ähnlichkeit mit einer echten Person" },
};

export function checkText(text: string): { ok: true } | { ok: false; category: ModCategory } {
  for (const r of rules) if (r.re.test(text)) return { ok: false, category: r.cat };
  return { ok: true };
}
