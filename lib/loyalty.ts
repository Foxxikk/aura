import type { State } from "./store";

type L = "cs" | "en" | "de";
export type Level = { id: string; min: number; name: Record<L, string>; color: string; discount: number; perks: Record<L, string[]> };

export const levels: Level[] = [
  { id: "bronze", min: 0, color: "#c08457", discount: 0, name: { cs: "Bronz", en: "Bronze", de: "Bronze" },
    perks: { cs: ["Přístup k akcím platformy"], en: ["Access to platform deals"], de: ["Zugang zu Plattform-Aktionen"] } },
  { id: "silver", min: 500, color: "#b8c0cc", discount: 5, name: { cs: "Stříbro", en: "Silver", de: "Silber" },
    perks: { cs: ["−5 % na PPV a balíčky", "Odznak u jména v chatu"], en: ["−5% on PPV and bundles", "Badge next to your name in chat"], de: ["−5 % auf PPV und Pakete", "Abzeichen neben deinem Namen im Chat"] } },
  { id: "gold", min: 1500, color: "#e9b18a", discount: 10, name: { cs: "Zlato", en: "Gold", de: "Gold" },
    perks: { cs: ["−10 % na PPV a balíčky", "Přednostní otázky v živých událostech", "Dřívější přístup k novým personám"], en: ["−10% on PPV and bundles", "Priority questions in live events", "Early access to new personas"], de: ["−10 % auf PPV und Pakete", "Vorrang bei Fragen in Live-Events", "Früher Zugang zu neuen Personas"] } },
  { id: "platinum", min: 4000, color: "#c9b6ff", discount: 15, name: { cs: "Platina", en: "Platinum", de: "Platin" },
    perks: { cs: ["−15 % na PPV a balíčky", "Měsíční bonusový set zdarma", "Vstupenky na živé události zdarma"], en: ["−15% on PPV and bundles", "Free monthly bonus set", "Free live event tickets"], de: ["−15 % auf PPV und Pakete", "Monatliches Bonus-Set gratis", "Kostenlose Live-Event-Tickets"] } },
];

export type Badge = { id: string; icon: string; name: Record<L, string>; desc: Record<L, string>; earned: boolean };

export function streak(days: string[]) {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

type S = Pick<State, "transactions" | "chats" | "likes" | "visitDays" | "subscriptions" | "unlocked" | "eventJoined">;

export function loyalty(s: S) {
  const spent = s.transactions.filter((t) => t.amount < 0).reduce((a, t) => a - t.amount, 0);
  const tips = s.transactions.filter((t) => t.kind === "tip").reduce((a, t) => a - t.amount, 0);
  const msgs = Object.values(s.chats).flat().filter((m) => m.from === "fan").length;
  const st = streak(s.visitDays);
  const points = Math.round(spent * 10 + msgs * 2 + s.likes.length * 5 + st * 20);
  const level = [...levels].reverse().find((l) => points >= l.min)!;
  const next = levels.find((l) => l.min > points);
  const badges: Badge[] = [
    { id: "first", icon: "✦", earned: s.transactions.some((t) => t.amount < 0), name: { cs: "První nákup", en: "First purchase", de: "Erster Kauf" }, desc: { cs: "Odemkni cokoli", en: "Unlock anything", de: "Schalte etwas frei" } },
    { id: "three", icon: "❖", earned: Object.keys(s.subscriptions).length >= 3, name: { cs: "Sběratel person", en: "Persona collector", de: "Persona-Sammler" }, desc: { cs: "Odebírej 3 persony", en: "Follow 3 personas", de: "Abonniere 3 Personas" } },
    { id: "streak7", icon: "☀", earned: st >= 7, name: { cs: "Týden v řadě", en: "Week streak", de: "Wochen-Serie" }, desc: { cs: "7 dní návštěv v řadě", en: "Visit 7 days in a row", de: "7 Tage in Folge besuchen" } },
    { id: "generous", icon: "♥", earned: tips >= 50, name: { cs: "Štědrá duše", en: "Generous soul", de: "Großzügig" }, desc: { cs: "Pošli tipy za 50 €", en: "Send €50 in tips", de: "Sende 50 € Trinkgeld" } },
    { id: "collector", icon: "▣", earned: s.unlocked.length >= 10, name: { cs: "Sběratel obsahu", en: "Content collector", de: "Inhalts-Sammler" }, desc: { cs: "Odemkni 10 příspěvků", en: "Unlock 10 posts", de: "Schalte 10 Beiträge frei" } },
    { id: "chatty", icon: "✉", earned: msgs >= 50, name: { cs: "Upovídaný", en: "Chatterbox", de: "Plaudertasche" }, desc: { cs: "Pošli 50 zpráv", en: "Send 50 messages", de: "Sende 50 Nachrichten" } },
    { id: "live", icon: "◉", earned: s.eventJoined.length >= 1, name: { cs: "Naživo", en: "Live fan", de: "Live dabei" }, desc: { cs: "Zúčastni se živé události", en: "Join a live event", de: "Nimm an einem Live-Event teil" } },
  ];
  return { points, level, next, streak: st, badges, spent };
}

/** Cena PPV / balíčku po slevě VIP a věrnostní úrovně. */
export function finalPrice(base: number, opts: { vip?: boolean; loyaltyDiscount?: number }) {
  const p = base * (opts.vip ? 0.8 : 1) * (1 - (opts.loyaltyDiscount ?? 0) / 100);
  return Math.round(p * 100) / 100;
}
