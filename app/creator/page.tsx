"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { bundlePrice, currentEvent, personas, posts } from "@/lib/data";
import { Broadcast, ChatMessage, CustomRequest, Segment, useStore } from "@/lib/store";
import { Avatar, MediaTile } from "@/components/Visuals";

// Demo: přihlášený tvůrce je studio Northlight Studio, které provozuje víc person.
const STUDIO = "Northlight Studio";
const studioPersonas = personas.filter((p) => p.creatorStudio === STUDIO);

function useCreator() {
  const { creatorPersonaId } = useStore();
  const persona = studioPersonas.find((p) => p.id === creatorPersonaId) ?? studioPersonas[0];
  return { persona, myPosts: posts.filter((x) => x.personaId === persona.id) };
}

type Role = "owner" | "editor" | "operator" | "accountant";
const roleLabel: Record<Role, string> = { owner: "Vlastník", editor: "Editor obsahu", operator: "Chat operátor", accountant: "Účetní" };
const roleTabs: Record<Role, string[]> = {
  owner: ["overview", "inbox", "broadcast", "vault", "requests", "persona", "team", "payouts"],
  editor: ["vault", "requests", "persona"],
  operator: ["inbox", "broadcast", "requests"],
  accountant: ["overview", "payouts"],
};

// Barvy grafů ověřené validátorem (tmavý povrch, CVD).
const SERIES = [
  { key: "subs", label: "Předplatné", color: "#d0507f" },
  { key: "ppv", label: "PPV", color: "#8a6cd1" },
  { key: "bundles", label: "Balíčky a chat", color: "#c97a40" },
  { key: "tips", label: "Tipy", color: "#2f9e8f" },
] as const;

const baseWeeks = [
  { w: "T37", subs: 1840, ppv: 920, bundles: 640, tips: 210 },
  { w: "T38", subs: 1910, ppv: 1180, bundles: 790, tips: 260 },
  { w: "T39", subs: 1990, ppv: 1050, bundles: 860, tips: 240 },
  { w: "T40", subs: 2080, ppv: 1420, bundles: 1010, tips: 310 },
  { w: "T41", subs: 2150, ppv: 1530, bundles: 1120, tips: 290 },
];

const segments: { id: Segment; label: string; share: number; hint: string }[] = [
  { id: "all", label: "Všichni předplatitelé", share: 1, hint: "celá základna" },
  { id: "vip", label: "Jen VIP", share: 0.18, hint: "nejvyšší konverze" },
  { id: "inactive", label: "Neaktivní 3+ dny", share: 0.27, hint: "návrat fanoušků" },
  { id: "no_ppv", label: "Ještě nekoupili PPV", share: 0.41, hint: "první nákup" },
];

type Tab = "overview" | "inbox" | "broadcast" | "vault" | "requests" | "persona" | "team" | "payouts";

export default function Creator() {
  const store = useStore();
  const { persona } = useCreator();
  const { creatorRole, set } = store;
  const allowed = roleTabs[creatorRole];
  const [tabRaw, setTab] = useState<Tab>("overview");
  const tab: Tab = allowed.includes(tabRaw) ? tabRaw : (allowed[0] as Tab);
  const pendingReq = store.customRequests.filter((r) => r.personaId === persona.id && (r.status === "requested" || r.status === "accepted" || r.status === "in_progress")).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar p={persona} size={56} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wider text-muted">Studio {STUDIO} · {studioPersonas.length} persony</p>
          <select className="mt-1 bg-transparent font-display text-4xl outline-none" value={persona.id} onChange={(e) => set(() => ({ creatorPersonaId: e.target.value }))}>
            {studioPersonas.map((p) => <option key={p.id} value={p.id} className="bg-surface text-base">{p.name}</option>)}
          </select>
        </div>
        <label className="text-xs text-muted">
          Zobrazit jako
          <select className="input mt-1 py-1.5" value={creatorRole} onChange={(e) => set(() => ({ creatorRole: e.target.value as Role }))}>
            {(Object.keys(roleLabel) as Role[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </select>
        </label>
        <Link href="/creator/onboarding" className="btn-ghost">+ Nová persona</Link>
        <Link href={`/c/${persona.handle}`} className="btn-ghost">Zobrazit profil</Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line">
        {([["overview", "Statistiky"], ["inbox", "Co-pilot inbox"], ["broadcast", "Hromadné zprávy"], ["vault", "Vault a balíčky"], ["requests", `Na přání${pendingReq ? ` (${pendingReq})` : ""}`], ["persona", "Persona a chat"], ["team", "Tým"], ["payouts", "Výplaty"]] as const).filter(([k]) => allowed.includes(k)).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm ${tab === k ? "border-gold" : "border-transparent text-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "overview" && <Overview />}
      {tab === "inbox" && <Inbox />}
      {tab === "broadcast" && <Broadcasts />}
      {tab === "vault" && <Vault />}
      {tab === "requests" && <Requests />}
      {tab === "persona" && <PersonaCard />}
      {tab === "team" && <Team />}
      {tab === "payouts" && <Payouts />}
    </div>
  );
}

/* ---------------- Statistiky ---------------- */

function Overview() {
  const { persona, myPosts } = useCreator();
  void myPosts;
  const { transactions, chats, broadcasts } = useStore();
  const mine = transactions.filter((t) => t.personaId === persona.id && t.amount < 0);
  const sumKind = (k: string[]) => mine.filter((t) => k.includes(t.kind ?? "")).reduce((s, t) => s - t.amount, 0);
  const real = { subs: sumKind(["sub"]), ppv: sumKind(["ppv"]), bundles: sumKind(["bundle", "custom"]), tips: sumKind(["tip"]) };
  const weeks = [...baseWeeks, { w: "T42 (teď)", subs: 1200 + real.subs, ppv: 760 + real.ppv, bundles: 540 + real.bundles, tips: 150 + real.tips }];
  const total = (w: (typeof weeks)[number]) => w.subs + w.ppv + w.bundles + w.tips;
  const max = Math.max(...weeks.map(total));
  const last = weeks[weeks.length - 2];
  const gross = total(last);

  const offered = (chats[persona.id] ?? []).filter((m) => m.ppv || m.bundle).length;
  const bought = mine.filter((t) => t.kind === "ppv" || t.kind === "bundle").length;
  const youLtv = mine.reduce((s, t) => s - t.amount, 0);

  const fans = [
    { name: "marek_88", since: "14 měs.", ltv: 1240, lastBuy: "včera" },
    { name: "jiri.k", since: "9 měs.", ltv: 865, lastBuy: "před 3 dny" },
    { name: "lukas_photo", since: "11 měs.", ltv: 710, lastBuy: "dnes" },
    { name: "Ty (demo účet)", since: "nový", ltv: youLtv, lastBuy: youLtv ? "dnes" : "–" },
    { name: "tomas.v", since: "4 měs.", ltv: 390, lastBuy: "před týdnem" },
  ].sort((a, b) => b.ltv - a.ltv);

  // Nejlepší čas na hromadné zprávy: otevřenost podle dne a 3h bloku (ilustrační model)
  const days = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
  const blocks = ["0–3", "3–6", "6–9", "9–12", "12–15", "15–18", "18–21", "21–24"];
  const rate = (d: number, b: number) => {
    const evening = [0.22, 0.08, 0.18, 0.31, 0.38, 0.44, 0.71, 0.62][b];
    const weekend = d >= 4 ? 1.15 : 1;
    return Math.min(0.95, evening * weekend * (0.9 + ((d * 7 + b * 3) % 5) / 25));
  };
  let best = { d: 0, b: 0, r: 0 };
  days.forEach((_, d) => blocks.forEach((_, b) => { const r = rate(d, b); if (r > best.r) best = { d, b, r }; }));

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Hrubý příjem (minulý týden)", `${gross.toLocaleString("cs-CZ")} €`],
          ["Tvůj podíl 80 %", `${Math.round(gross * 0.8).toLocaleString("cs-CZ")} €`],
          ["Průměrná hodnota fanouška (LTV)", "184 €"],
          ["Konverze PPV v chatu", offered ? `${Math.round((bought / offered) * 100)} %` : "–"],
        ].map(([l, v]) => (
          <div key={l} className="card p-5">
            <p className="text-xs text-muted">{l}</p>
            <p className="mt-1 font-display text-3xl">{v}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Příjmy podle zdroje za týden (€)</h2>
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            {SERIES.map((s) => <span key={s.key} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>)}
          </div>
        </div>
        <div className="flex h-60 items-end gap-3 border-b border-line pb-px">
          {weeks.map((w) => (
            <div key={w.w} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              <div className="flex w-full max-w-14 flex-col-reverse gap-[2px]" style={{ height: `${(total(w) / max) * 100}%` }}>
                {SERIES.map((s, i) => (
                  <div key={s.key} style={{ flex: w[s.key], background: s.color, borderRadius: i === SERIES.length - 1 ? "4px 4px 0 0" : 0 }} />
                ))}
              </div>
              <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden w-44 rounded-xl border border-line bg-surface-2 p-3 text-xs shadow-xl group-hover:block">
                <p className="mb-1 font-semibold">{w.w}</p>
                {SERIES.map((s) => <p key={s.key} className="flex justify-between"><span className="text-muted">{s.label}</span><span>{Math.round(w[s.key]).toLocaleString("cs-CZ")} €</span></p>)}
                <p className="mt-1 flex justify-between border-t border-line pt-1"><span>Celkem</span><b>{Math.round(total(w)).toLocaleString("cs-CZ")} €</b></p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-3">{weeks.map((w) => <span key={w.w} className="flex-1 text-center text-xs text-muted">{w.w}</span>)}</div>
        <p className="mt-3 text-xs text-muted">Týdny T37–T41 a základ T42 jsou ilustrační; k T42 se přičítají tvoje skutečné demo nákupy.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Nejlepší čas na hromadnou zprávu</h2>
          <p className="mt-1 text-sm text-muted">Otevřenost zpráv podle dne a hodiny. Doporučení: <b className="text-ink">{days[best.d]} {blocks[best.b]} h</b> ({Math.round(best.r * 100)} %).</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-[2px] text-[10px]">
              <thead><tr><th />{blocks.map((b) => <th key={b} className="font-normal text-muted">{b}</th>)}</tr></thead>
              <tbody>
                {days.map((d, di) => (
                  <tr key={d}>
                    <td className="pr-1 text-muted">{d}</td>
                    {blocks.map((b, bi) => {
                      const r = rate(di, bi);
                      return <td key={b} title={`${d} ${b} h: ${Math.round(r * 100)} % otevřenost`} className="h-7 rounded" style={{ background: `rgba(208, 80, 127, ${0.08 + r * 0.92})` }} />;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Světlejší = nižší otevřenost. Ilustrační model.</p>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Top fanoušci podle hodnoty (LTV)</h2>
          <table className="mt-3 w-full text-sm">
            <thead><tr className="text-left text-xs text-muted"><th className="py-1 font-normal">Fanoušek</th><th className="font-normal">Předplatitel</th><th className="font-normal">Poslední nákup</th><th className="text-right font-normal">LTV</th></tr></thead>
            <tbody className="divide-y divide-line">
              {fans.map((f) => (
                <tr key={f.name}><td className="py-2">{f.name}</td><td className="text-muted">{f.since}</td><td className="text-muted">{f.lastBuy}</td><td className="text-right font-semibold">{f.ltv.toLocaleString("cs-CZ")} €</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">Které zprávy prodávají</h2>
        {!broadcasts.filter((b) => b.personaId === persona.id).length ? (
          <p className="mt-2 text-sm text-muted">Zatím žádné hromadné zprávy. Pošli první v záložce Hromadné zprávy.</p>
        ) : (
          <BroadcastTable list={broadcasts.filter((b) => b.personaId === persona.id)} />
        )}
      </div>
    </div>
  );
}

function BroadcastTable({ list }: { list: Broadcast[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead><tr className="text-left text-xs text-muted"><th className="py-1 font-normal">Zpráva</th><th className="font-normal">Segment</th><th className="text-right font-normal">Příjemci</th><th className="text-right font-normal">Otevřeno</th><th className="text-right font-normal">Nákupy</th><th className="text-right font-normal">Tržba</th></tr></thead>
        <tbody className="divide-y divide-line">
          {list.map((b) => (
            <tr key={b.id}>
              <td className="max-w-56 truncate py-2">{b.text}</td>
              <td className="text-muted">{segments.find((s) => s.id === b.segment)?.label}</td>
              <td className="text-right">{b.recipients.toLocaleString("cs-CZ")}</td>
              <td className="text-right">{Math.round((b.opened / b.recipients) * 100)} %</td>
              <td className="text-right">{b.purchases}</td>
              <td className="text-right font-semibold">{b.price ? Math.round(b.purchases * b.price).toLocaleString("cs-CZ") + " €" : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Hromadné zprávy ---------------- */

function Broadcasts() {
  const { persona, myPosts } = useCreator();
  void myPosts;
  const store = useStore();
  const { bundles, broadcasts, subscriptions, lastFanActivity, transactions, set } = store;
  const [text, setText] = useState("");
  const [attach, setAttach] = useState("none");
  const [segment, setSegment] = useState<Segment>("all");
  const [sent, setSent] = useState<string | null>(null);
  const myBundles = bundles.filter((b) => b.personaId === persona.id);
  const ppvPosts = myPosts.filter((x) => x.access === "ppv");
  const seg = segments.find((s) => s.id === segment)!;
  const recipients = Math.round(persona.subscribers * seg.share);

  function fanMatches() {
    if (!subscriptions[persona.id]) return false;
    if (segment === "vip") return subscriptions[persona.id] === "vip";
    if (segment === "inactive") return Date.now() - (lastFanActivity[persona.id] ?? 0) > 3 * 86_400_000;
    if (segment === "no_ppv") return !transactions.some((t) => t.personaId === persona.id && t.kind === "ppv");
    return true;
  }

  function send() {
    const id = crypto.randomUUID();
    let price: number | undefined;
    const msg: Partial<ChatMessage> = { text, broadcastId: id };
    if (attach.startsWith("ppv:")) {
      const post = ppvPosts.find((x) => x.id === attach.slice(4))!;
      price = post.price;
      msg.ppv = { postId: post.id, title: post.caption, price: post.price! };
    } else if (attach.startsWith("bundle:")) {
      const b = myBundles.find((x) => x.id === attach.slice(7))!;
      price = bundlePrice(b, currentEvent.bundleDiscount).price;
      msg.bundle = { bundleId: b.id, title: b.title, price };
    }
    const openRate = 0.45 + Math.random() * 0.25;
    const conv = segment === "vip" ? 0.14 : segment === "no_ppv" ? 0.05 : 0.08;
    const bc: Broadcast = {
      id, personaId: persona.id, text, ppvPostId: msg.ppv?.postId, bundleId: msg.bundle?.bundleId, price, segment,
      sentAt: Date.now(), recipients, opened: Math.round(recipients * openRate), purchases: price ? Math.round(recipients * openRate * conv) : 0,
    };
    const deliver = fanMatches();
    set((s) => ({
      broadcasts: [bc, ...s.broadcasts],
      scheduled: deliver
        ? [...s.scheduled, { id: crypto.randomUUID(), personaId: persona.id, readAt: Date.now(), typingFrom: Date.now() + 1500, deliverAt: Date.now() + 3500, msg: { id: crypto.randomUUID(), from: "persona", at: Date.now(), ...msg } as ChatMessage }]
        : s.scheduled,
    }));
    setSent(deliver ? "Odesláno. Zpráva dorazí i do tvého demo chatu s Elenou." : "Odesláno. Tvůj demo účet do segmentu nepatří, takže ji neuvidíš.");
    setText("");
    setAttach("none");
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <h2 className="font-display text-2xl">Nová hromadná zpráva</h2>
        <p className="text-sm text-muted">Zpráva přijde každému fanouškovi do soukromého chatu jako od persony. Fanoušci vidí, že jde o AI personu.</p>
        <textarea className="input min-h-28" placeholder="např. dneska jsem fotila u moře a tenhle set je jen pro tebe…" value={text} onChange={(e) => setText(e.target.value)} />
        <label className="block">
          <span className="text-sm font-medium">Příloha</span>
          <select className="input mt-1" value={attach} onChange={(e) => setAttach(e.target.value)}>
            <option value="none">Bez přílohy</option>
            <optgroup label="PPV z vaultu">{ppvPosts.map((x) => <option key={x.id} value={`ppv:${x.id}`}>{x.caption} · {x.price} €</option>)}</optgroup>
            <optgroup label="Balíčky">{myBundles.map((b) => <option key={b.id} value={`bundle:${b.id}`}>{b.title} · {bundlePrice(b, currentEvent.bundleDiscount).price} €</option>)}</optgroup>
          </select>
        </label>
        <div>
          <span className="text-sm font-medium">Komu</span>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {segments.map((s) => (
              <button type="button" key={s.id} onClick={() => setSegment(s.id)} className={`rounded-xl border p-3 text-left text-sm ${segment === s.id ? "border-gold bg-gold/10" : "border-line"}`}>
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-muted">{Math.round(persona.subscribers * s.share).toLocaleString("cs-CZ")} fanoušků · {s.hint}</p>
              </button>
            ))}
          </div>
        </div>
        <button className="btn-primary w-full" disabled={!text.trim()}>Odeslat {recipients.toLocaleString("cs-CZ")} fanouškům</button>
        {sent && <p className="text-sm text-ok">{sent}</p>}
        <p className="text-[11px] text-muted">Limit: 1 hromadná zpráva s PPV denně na segment, aby fanoušci nebyli zahlceni.</p>
      </form>
      <div className="card p-6">
        <h3 className="font-semibold">Odeslané</h3>
        {!broadcasts.filter((b) => b.personaId === persona.id).length ? <p className="mt-2 text-sm text-muted">Zatím nic.</p> : (
          <ul className="mt-3 space-y-3 text-sm">
            {broadcasts.filter((b) => b.personaId === persona.id).map((b) => (
              <li key={b.id} className="rounded-xl bg-surface-2 p-3">
                <p className="line-clamp-2">{b.text}</p>
                <p className="mt-1 text-xs text-muted">{new Date(b.sentAt).toLocaleString("cs-CZ")} · {Math.round((b.opened / b.recipients) * 100)} % otevřeno · {b.purchases} nákupů</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------------- Vault a balíčky ---------------- */

function Vault() {
  const { persona, myPosts } = useCreator();
  void myPosts;
  const { bundles, set } = useStore();
  const [filter, setFilter] = useState<"all" | "free" | "subscribers" | "ppv">("all");
  const [sel, setSel] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [discount, setDiscount] = useState(25);
  const list = myPosts.filter((x) => filter === "all" || x.access === filter);
  const myBundles = bundles.filter((b) => b.personaId === persona.id);
  const preview = useMemo(() => bundlePrice({ id: "x", personaId: persona.id, title, postIds: sel, discount }), [sel, discount, title]);

  function create() {
    set((s) => ({ bundles: [...s.bundles, { id: crypto.randomUUID(), personaId: persona.id, title: title.trim(), postIds: sel, discount, createdAt: Date.now() }] }));
    setSel([]);
    setTitle("");
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="card border-dashed p-6 text-center">
        <p className="font-semibold">Nahrát do vaultu</p>
        <p className="mt-1 text-sm text-muted">Obrázky a videa projdou automatickou kontrolou a ruční moderací. Metadata o AI původu (C2PA) se přidají automaticky.</p>
        <button className="btn-ghost mt-4" onClick={() => alert("V MVP není nahrávání zapojené – v produkci S3 + moderace.")}>Vybrat soubory</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([["all", "Vše"], ["free", "Zdarma"], ["subscribers", "Předplatitelé"], ["ppv", "PPV"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`chip ${filter === k ? "border-gold text-gold" : ""}`}>{l}</button>
        ))}
        <span className="ml-auto text-xs text-muted">Klikni na položky a slož z nich balíček</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((x) => {
          const on = sel.includes(x.id);
          return (
            <button key={x.id} onClick={() => setSel(on ? sel.filter((i) => i !== x.id) : [...sel, x.id])} className={`card overflow-hidden text-left transition ${on ? "border-gold ring-2 ring-gold/40" : ""}`}>
              <div className="relative">
                <MediaTile hue={x.hue} className="aspect-square" />
                {on && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs text-[#1a0f12]">✓</span>}
              </div>
              <div className="p-2 text-xs">
                <p className="truncate">{x.caption}</p>
                <p className="text-muted">{x.access === "free" ? "Zdarma" : x.access === "subscribers" ? "Předplatitelé" : `PPV ${x.price} €`}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form className="card space-y-3 p-6" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <h3 className="font-display text-2xl">Nový balíček</h3>
          <input className="input" placeholder="Název balíčku" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="block text-sm">Sleva {discount} %
            <input type="range" min={0} max={60} step={5} value={discount} onChange={(e) => setDiscount(+e.target.value)} className="mt-1 w-full accent-[#e9b18a]" />
          </label>
          <p className="text-sm text-muted">{sel.length} položek · běžně {preview.full} € → <b className="text-ink">{preview.price} €</b> (+ akce platformy −{currentEvent.bundleDiscount} %)</p>
          <button className="btn-primary w-full" disabled={!title.trim() || sel.length < 2}>Vytvořit balíček</button>
          <p className="text-[11px] text-muted">AI persona může balíček nabídnout v chatu a ty ho můžeš přiložit k hromadné zprávě.</p>
        </form>
        <div className="card p-6">
          <h3 className="font-semibold">Balíčky ({myBundles.length})</h3>
          <ul className="mt-3 divide-y divide-line">
            {myBundles.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{b.title}</p>
                  <p className="text-xs text-muted">{b.postIds.length} položek · −{b.discount} % · {bundlePrice(b, currentEvent.bundleDiscount).price} €</p>
                </div>
                <button className="text-xs text-muted hover:text-rose" onClick={() => set((s) => ({ bundles: s.bundles.filter((x) => x.id !== b.id) }))}>Odebrat</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Požadavky na přání ---------------- */

function Requests() {
  const { persona, myPosts } = useCreator();
  void myPosts;
  const { customRequests, set } = useStore();
  const list = customRequests.filter((r) => r.personaId === persona.id);

  function update(r: CustomRequest, status: CustomRequest["status"]) {
    set((s) => {
      const next: Partial<typeof s> = { customRequests: s.customRequests.map((x) => (x.id === r.id ? { ...x, status } : x)) };
      if (status === "declined") {
        next.balance = s.balance + r.deposit;
        next.transactions = [{ id: crypto.randomUUID(), at: Date.now(), label: `Vrácená záloha – ${r.topic}`, amount: r.deposit, personaId: persona.id, kind: "custom" }, ...s.transactions];
      }
      if (status === "delivered") {
        const postId = `custom-${r.id}`;
        const msg: ChatMessage = {
          id: crypto.randomUUID(), from: "persona", at: Date.now(),
          text: `tvůj set na přání je hotový 🙂 „${r.topic}“ – zbývá doplatit ${r.price - r.deposit} €`,
          ppv: { postId, title: `Na přání: ${r.topic}`, price: r.price - r.deposit },
        };
        next.scheduled = [...s.scheduled, { id: crypto.randomUUID(), personaId: persona.id, readAt: Date.now(), typingFrom: Date.now() + 1000, deliverAt: Date.now() + 3000, msg }];
      }
      return next;
    });
  }

  if (!list.length) return <p className="card mt-6 p-8 text-center text-muted">Zatím žádné požadavky. Fanoušci je zadávají na profilu persony v záložce Na přání.</p>;

  return (
    <div className="mt-6 space-y-3">
      {list.map((r) => (
        <div key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="font-semibold">{r.topic}</p>
            <p className="text-sm text-muted">{r.style || "bez upřesnění stylu"}</p>
            <p className="mt-1 text-xs text-muted">{r.price} € · záloha {r.deposit} € zaplacena · {new Date(r.createdAt).toLocaleString("cs-CZ")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.status === "requested" && <><button className="btn-primary" onClick={() => update(r, "accepted")}>Přijmout</button><button className="btn-ghost" onClick={() => update(r, "declined")}>Odmítnout a vrátit zálohu</button></>}
            {r.status === "accepted" && <button className="btn-primary" onClick={() => update(r, "in_progress")}>Začít výrobu</button>}
            {r.status === "in_progress" && <button className="btn-primary" onClick={() => update(r, "delivered")}>Doručit do chatu</button>}
            {r.status === "delivered" && <span className="chip border-ok/40 text-ok">Doručeno</span>}
            {r.status === "declined" && <span className="chip text-rose">Odmítnuto</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Persona a chat ---------------- */

function PersonaCard() {
  const { persona, myPosts } = useCreator();
  void myPosts;
  const [card, setCard] = useState({ personality: persona.personality, writingStyle: persona.writingStyle, boundaries: persona.boundaries, wake: persona.schedule.wake, sleep: persona.schedule.sleep });
  const [saved, setSaved] = useState(false);
  return (
    <form className="card mt-6 space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
      <p className="text-sm text-muted">Karta persony řídí, jak AI v chatu píše, kdy odpovídá a co si pamatuje. Persona se vždy prezentuje jako AI.</p>
      {([["personality", "Povaha"], ["writingStyle", "Styl psaní"], ["boundaries", "Hranice a zakázaná témata"]] as const).map(([k, l]) => (
        <label key={k} className="block">
          <span className="text-sm font-medium">{l}</span>
          <textarea className="input mt-1 min-h-20" value={card[k]} onChange={(e) => setCard({ ...card, [k]: e.target.value })} />
        </label>
      ))}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="text-sm font-medium">Vstává (hodina, {persona.timezone})</span>
          <input type="number" min={0} max={23} className="input mt-1" value={card.wake} onChange={(e) => setCard({ ...card, wake: +e.target.value })} /></label>
        <label className="block"><span className="text-sm font-medium">Jde spát (hodina)</span>
          <input type="number" min={0} max={24} className="input mt-1" value={card.sleep} onChange={(e) => setCard({ ...card, sleep: +e.target.value })} /></label>
      </div>
      {[
        ["VIP fanoušci dostávají rychlejší odpovědi", true],
        ["AI smí v chatu nabízet PPV a balíčky z vaultu", true],
        ["Proaktivní zprávy: persona se ozve po 36 h ticha (max 1× denně, jen když je vzhůru)", true],
        ["Hlasové zprávy pro VIP (AI hlas persony)", true],
        ["AI si pamatuje fakta o fanouškovi (fanoušek je vidí a může smazat)", true],
        ["Upozorni mě, když chce fanoušek převzetí chatu člověkem", false],
      ].map(([l, on]) => (
        <label key={l as string} className="flex items-start gap-2 text-sm"><input type="checkbox" defaultChecked={on as boolean} className="mt-1" /> {l}</label>
      ))}
      <button className="btn-primary">{saved ? "Uloženo ✓" : "Uložit kartu persony"}</button>
      <p className="text-xs text-muted">Demo: změny se neukládají na server.</p>
    </form>
  );
}

/* ---------------- Tým studia ---------------- */

const perms: { label: string; roles: Role[] }[] = [
  { label: "Statistiky a příjmy", roles: ["owner", "accountant"] },
  { label: "Hromadné zprávy", roles: ["owner", "operator"] },
  { label: "Vault, balíčky, nahrávání", roles: ["owner", "editor"] },
  { label: "Požadavky na přání", roles: ["owner", "editor", "operator"] },
  { label: "Karta persony a nastavení AI", roles: ["owner", "editor"] },
  { label: "Tým a role", roles: ["owner"] },
  { label: "Výplaty a faktury", roles: ["owner", "accountant"] },
];

function Team() {
  const { studioMembers, set } = useStore();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("operator");
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="card p-6">
        <h2 className="font-semibold">Členové studia</h2>
        <ul className="mt-3 divide-y divide-line">
          {studioMembers.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p>{m.email}</p>
                <p className="text-xs text-muted">{m.accepted ? "Aktivní" : "Pozvánka odeslána"} · od {new Date(m.invitedAt).toLocaleDateString("cs-CZ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <select className="input w-auto py-1.5" value={m.role} disabled={m.role === "owner"} onChange={(e) => set((s) => ({ studioMembers: s.studioMembers.map((x) => (x.id === m.id ? { ...x, role: e.target.value as Role } : x)) }))}>
                  {(Object.keys(roleLabel) as Role[]).map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
                </select>
                {m.role !== "owner" && <button className="text-xs text-muted hover:text-rose" onClick={() => set((s) => ({ studioMembers: s.studioMembers.filter((x) => x.id !== m.id) }))}>Odebrat</button>}
              </div>
            </li>
          ))}
        </ul>
        <form className="mt-4 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); set((s) => ({ studioMembers: [...s.studioMembers, { id: crypto.randomUUID(), email, role, invitedAt: Date.now(), accepted: false }] })); setEmail(""); }}>
          <input className="input flex-1" type="email" placeholder="e-mail nového člena" value={email} onChange={(e) => setEmail(e.target.value)} />
          <select className="input w-auto" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {(Object.keys(roleLabel) as Role[]).filter((r) => r !== "owner").map((r) => <option key={r} value={r}>{roleLabel[r]}</option>)}
          </select>
          <button className="btn-primary" disabled={!email.includes("@")}>Pozvat</button>
        </form>
        <p className="mt-2 text-[11px] text-muted">Demo: pozvánka se neposílá e-mailem. Každý člen týmu musí projít ověřením identity.</p>
      </div>
      <div className="card p-6">
        <h2 className="font-semibold">Oprávnění rolí</h2>
        <table className="mt-3 w-full text-xs">
          <thead><tr className="text-left text-muted"><th className="py-1 font-normal" />{(Object.keys(roleLabel) as Role[]).map((r) => <th key={r} className="px-1 text-center font-normal">{roleLabel[r].split(" ")[0]}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {perms.map((p) => (
              <tr key={p.label}><td className="py-2 pr-2">{p.label}</td>{(Object.keys(roleLabel) as Role[]).map((r) => <td key={r} className="text-center">{p.roles.includes(r) ? <span className="text-ok">✓</span> : <span className="text-muted">–</span>}</td>)}</tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-[11px] text-muted">Přepínačem „Zobrazit jako“ nahoře si vyzkoušíš, co která role vidí.</p>
      </div>
    </div>
  );
}

/* ---------------- Výplaty ---------------- */

function Payouts() {
  const { transactions } = useStore();
  const rows = studioPersonas.map((p, i) => {
    const real = transactions.filter((t) => t.personaId === p.id && t.amount < 0).reduce((a, t) => a - t.amount, 0);
    const gross = [5090, 3870, 2950][i % 3] + real;
    return { p, gross, fee: gross * 0.2, net: gross * 0.8 };
  });
  const total = rows.reduce((a, r) => a + r.net, 0);
  const history = [
    { date: "2026-10-06", amount: 6740 }, { date: "2026-09-29", amount: 6410 }, { date: "2026-09-22", amount: 6105 }, { date: "2026-09-15", amount: 5880 },
  ];
  const fmt = (n: number) => `${Math.round(n).toLocaleString("cs-CZ")} €`;
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs text-muted">K výplatě v pondělí</p><p className="mt-1 font-display text-3xl">{fmt(total)}</p></div>
        <div className="card p-5"><p className="text-xs text-muted">Z toho rezerva na chargebacky (7 dní)</p><p className="mt-1 font-display text-3xl">{fmt(total * 0.1)}</p></div>
        <div className="card p-5"><p className="text-xs text-muted">Výplatní účet</p><p className="mt-1 font-display text-3xl">CZ •• 4417</p></div>
      </div>
      <div className="card overflow-x-auto p-6">
        <h2 className="font-semibold">Tento týden podle persony</h2>
        <table className="mt-3 w-full min-w-[480px] text-sm">
          <thead><tr className="text-left text-xs text-muted"><th className="py-1 font-normal">Persona</th><th className="text-right font-normal">Hrubý příjem</th><th className="text-right font-normal">Provize 20 %</th><th className="text-right font-normal">Čistý příjem</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => <tr key={r.p.id}><td className="py-2">{r.p.name}</td><td className="text-right">{fmt(r.gross)}</td><td className="text-right text-muted">−{fmt(r.fee)}</td><td className="text-right font-semibold">{fmt(r.net)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="card p-6">
        <h2 className="font-semibold">Historie výplat</h2>
        <ul className="mt-3 divide-y divide-line text-sm">
          {history.map((h) => <li key={h.date} className="flex justify-between py-2"><span>{new Date(h.date).toLocaleDateString("cs-CZ")}</span><span>{fmt(h.amount)} · <span className="text-ok">vyplaceno</span></span></li>)}
        </ul>
        <p className="mt-3 text-[11px] text-muted">Ilustrační data. V produkci výplaty přes platební bránu s fakturou a vyúčtováním DPH.</p>
      </div>
    </div>
  );
}

/* ---------------- Co-pilot inbox ---------------- */

type Thread = { id: string; fan: string; real: boolean; vip: boolean; spent: number; msgs: { from: "fan" | "persona"; text: string }[] };

const demoThreads = (personaName: string): Thread[] => [
  { id: "d1", fan: "marek_88", real: false, vip: true, spent: 1240, msgs: [{ from: "persona", text: "dobré ráno ☀️ jak ses vyspal?" }, { from: "fan", text: "skvěle, dneska jedu na hory. co ty?" }] },
  { id: "d2", fan: "jiri.k", real: false, vip: false, spent: 865, msgs: [{ from: "fan", text: `${personaName.split(" ")[0]}, ten poslední set byl nádherný. bude pokračování?` }] },
  { id: "d3", fan: "tomas.v", real: false, vip: false, spent: 390, msgs: [{ from: "fan", text: "ahoj, jsem tu nový 👋" }] },
];

function Inbox() {
  const { persona } = useCreator();
  const store = useStore();
  const { chats, subscriptions, transactions, set, memory, copilotSent } = store;
  const realMsgs = (chats[persona.id] ?? []).filter((m) => m.from !== "system" && m.text);
  const threads: Thread[] = [
    ...(realMsgs.length ? [{ id: "real", fan: "Ty (demo účet)", real: true, vip: subscriptions[persona.id] === "vip", spent: transactions.filter((t) => t.personaId === persona.id && t.amount < 0).reduce((a, t) => a - t.amount, 0), msgs: realMsgs.slice(-8).map((m) => ({ from: m.from as "fan" | "persona", text: m.text })) }] : []),
    ...demoThreads(persona.name),
  ];
  const [activeId, setActiveId] = useState(threads[0]?.id);
  const [local, setLocal] = useState<Record<string, { from: "fan" | "persona"; text: string }[]>>({});
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Record<string, "approve" | "auto">>({});
  const active = threads.find((t) => t.id === activeId) ?? threads[0];
  const msgs = active ? [...active.msgs, ...(local[active.id] ?? [])] : [];
  const waiting = (t: Thread) => { const all = [...t.msgs, ...(local[t.id] ?? [])]; return all[all.length - 1]?.from === "fan"; };

  async function suggest() {
    if (!active) return;
    setBusy(true);
    const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ personaId: persona.id, history: msgs, memory: active.real ? memory[persona.id] : undefined, tier: active.vip ? "vip" : "fan" }) }).then((r) => r.json()).catch(() => ({ replies: [] }));
    setDraft((res.replies ?? []).join("\n\n"));
    setBusy(false);
  }

  function send() {
    if (!active || !draft.trim()) return;
    const text = draft.trim();
    if (active.real) {
      const parts = text.split(/\n\s*\n/).filter(Boolean);
      let at = Date.now() + 800;
      set((s) => ({
        scheduled: [...s.scheduled, ...parts.map((p) => { const typingFrom = at; at += 1500 + p.length * 30; return { id: crypto.randomUUID(), personaId: persona.id, readAt: Date.now(), typingFrom, deliverAt: at, msg: { id: crypto.randomUUID(), from: "persona" as const, text: p, at } }; })],
        copilotSent: { ...s.copilotSent, [persona.id]: (s.copilotSent[persona.id] ?? 0) + 1 },
      }));
    } else {
      setLocal((l) => ({ ...l, [active.id]: [...(l[active.id] ?? []), { from: "persona", text }] }));
      set((s) => ({ copilotSent: { ...s.copilotSent, [persona.id]: (s.copilotSent[persona.id] ?? 0) + 1 } }));
    }
    setDraft("");
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="card divide-y divide-line overflow-hidden">
        <div className="p-3 text-xs text-muted">Konverzace {persona.name} · schváleno {copilotSent[persona.id] ?? 0} odpovědí</div>
        {threads.map((t) => (
          <button key={t.id} onClick={() => { setActiveId(t.id); setDraft(""); }} className={`block w-full p-3 text-left text-sm ${active?.id === t.id ? "bg-surface-2" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{t.fan}</span>
              <span className="flex gap-1">{t.vip && <span className="chip px-2 py-0 text-[10px] text-gold">VIP</span>}{waiting(t) && <span className="h-2 w-2 rounded-full bg-rose" />}</span>
            </div>
            <p className="truncate text-xs text-muted">{[...t.msgs, ...(local[t.id] ?? [])].slice(-1)[0]?.text}</p>
            <p className="text-[10px] text-muted">LTV {Math.round(t.spent)} €{t.real ? " · skutečný chat" : " · ukázka"}</p>
          </button>
        ))}
      </div>
      {active && (
        <div className="card flex min-h-[480px] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-3">
            <p className="font-semibold">{active.fan}</p>
            <div className="flex gap-1 text-xs">
              {(["approve", "auto"] as const).map((m) => (
                <button key={m} onClick={() => setMode((x) => ({ ...x, [active.id]: m }))} className={`chip ${ (mode[active.id] ?? (active.vip ? "approve" : "auto")) === m ? "border-gold text-gold" : ""}`}>
                  {m === "approve" ? "Schvalovat odpovědi" : "AI odpovídá sama"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "fan" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.from === "fan" ? "bg-surface-2" : "bg-gold/15"}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-line p-3">
            <textarea className="input min-h-20" placeholder="Napiš odpověď za personu, nebo si nech navrhnout…" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="flex flex-wrap justify-between gap-2">
              <button className="btn-ghost" onClick={suggest} disabled={busy}>{busy ? "Navrhuji…" : "✨ Návrh AI"}</button>
              <button className="btn-primary" onClick={send} disabled={!draft.trim()}>Schválit a odeslat</button>
            </div>
            <p className="text-[11px] text-muted">Odpověď odejde jako zpráva persony; fanoušek dál vidí štítek AI persona. Režim „AI odpovídá sama“ je výchozí pro běžné fanoušky, VIP mají schvalování.</p>
          </div>
        </div>
      )}
    </div>
  );
}
