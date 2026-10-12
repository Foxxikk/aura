"use client";

import { useEffect, useState } from "react";
import { personas, personaByHandle } from "@/lib/data";
import { type Gift, useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

function newCode() {
  const c = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, "X");
  return `AURA-${c()}-${c()}`;
}

export default function GiftPage() {
  const store = useStore();
  const { lang, giftsSent, giftsRedeemed, spend, set, topUp, dbEnabled, ready } = store;
  const t = useT();
  const [tab, setTab] = useState<"sub" | "card" | "redeem">("sub");
  const [personaId, setPersonaId] = useState(personas[0].id);
  const [tier, setTier] = useState("fan");
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState(25);
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const q = new URLSearchParams(window.location.search);
    const h = q.get("persona");
    if (h && personaByHandle(h)) setPersonaId(personaByHandle(h)!.id);
    const c = q.get("code");
    if (c) { setCode(c.toUpperCase()); setTab("redeem"); }
  }, []);

  if (!ready) return null;
  const p = personas.find((x) => x.id === personaId)!;
  const tierObj = p.tiers.find((x) => x.id === tier) ?? p.tiers[0];
  const price = tab === "sub" ? tierObj.price * months : amount;

  async function buy() {
    const g: Gift = tab === "sub"
      ? { code: newCode(), kind: "sub", personaId, tier: tierObj.id, months, to, message, createdAt: Date.now() }
      : { code: newCode(), kind: "card", amount, to, message, createdAt: Date.now() };
    const label = g.kind === "sub" ? `Dárek: předplatné ${tierObj.name} (${months} měs.) – ${p.name}` : `Dárková karta ${amount} €`;
    if (!spend(price, label, { personaId: g.personaId, kind: g.kind === "sub" ? "sub" : "topup" })) return alert(t("credit.low"));
    set((s) => ({ giftsSent: [g, ...s.giftsSent] }));
    if (dbEnabled) fetch("/api/gifts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(g) }).catch(() => {});
    setMsg(t("gift.ok", { what: g.code }));
  }

  async function redeem() {
    const c = code.trim().toUpperCase();
    let g: Gift | undefined = giftsSent.find((x) => x.code === c && !x.redeemed && !giftsRedeemed.includes(c));
    if (!g && dbEnabled) {
      const r = await fetch("/api/gifts/redeem", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: c }) });
      if (r.ok) g = (await r.json()).gift;
    }
    if (!g || giftsRedeemed.includes(c)) return setMsg(t("gift.invalid"));
    const gift = g;
    if (gift.kind === "card") topUp(gift.amount ?? 0);
    set((s) => ({
      giftsRedeemed: [...s.giftsRedeemed, c],
      giftsSent: s.giftsSent.map((x) => (x.code === c ? { ...x, redeemed: true } : x)),
      ...(gift.kind === "sub" && gift.personaId ? { subscriptions: { ...s.subscriptions, [gift.personaId]: gift.tier ?? "fan" }, subscribedAt: { ...s.subscribedAt, [gift.personaId]: Date.now() } } : {}),
    }));
    const gp = personas.find((x) => x.id === gift.personaId);
    setMsg(t("gift.ok", { what: gift.kind === "card" ? `+${gift.amount} €` : `${gp?.name} · ${gift.months}×` }));
    setCode("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-5xl">{t("gift.title")}</h1>
      <p className="text-muted">{t("gift.lead")}</p>
      <div className="flex gap-2 border-b border-line">
        {([["sub", t("gift.sub")], ["card", t("gift.card")], ["redeem", t("gift.redeem")]] as const).map(([k, l]) => (
          <button key={k} onClick={() => { setTab(k); setMsg(""); }} className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === k ? "border-gold" : "border-transparent text-muted"}`}>{l}</button>
        ))}
      </div>

      {tab !== "redeem" ? (
        <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); buy(); }}>
          {tab === "sub" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm">{t("gift.persona")}
                <select className="input mt-1" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>{personas.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
              </label>
              <label className="text-sm">{t("gift.tier")}
                <select className="input mt-1" value={tier} onChange={(e) => setTier(e.target.value)}>{p.tiers.map((x) => <option key={x.id} value={x.id}>{x.name} · {x.price} €</option>)}</select>
              </label>
              <label className="text-sm">{t("gift.months")}
                <select className="input mt-1" value={months} onChange={(e) => setMonths(+e.target.value)}>{[1, 3, 6].map((m) => <option key={m} value={m}>{m}</option>)}</select>
              </label>
            </div>
          ) : (
            <div>
              <p className="text-sm">{t("gift.amount")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[10, 25, 50, 100].map((a) => <button type="button" key={a} onClick={() => setAmount(a)} className={`chip ${amount === a ? "border-gold text-gold" : ""}`}>{a} €</button>)}
              </div>
            </div>
          )}
          <input className="input" placeholder={t("gift.to")} value={to} onChange={(e) => setTo(e.target.value)} />
          <textarea className="input min-h-16" placeholder={t("gift.message")} value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="btn-primary w-full">{t("gift.buy", { p: price })}</button>
        </form>
      ) : (
        <form className="card flex flex-wrap gap-2 p-6" onSubmit={(e) => { e.preventDefault(); redeem(); }}>
          <input className="input flex-1 font-mono uppercase" placeholder="AURA-XXXX-XXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="btn-primary" disabled={!code.trim()}>{t("gift.redeemBtn")}</button>
        </form>
      )}
      {msg && <p className="text-sm text-ok">{msg}</p>}

      {giftsSent.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold">{t("gift.sent")}</h2>
          <ul className="mt-3 divide-y divide-line text-sm">
            {giftsSent.map((g) => {
              const gp = personas.find((x) => x.id === g.personaId);
              const link = `${origin}/gift?code=${g.code}`;
              return (
                <li key={g.code} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-mono">{g.code}{g.redeemed ? " ✓" : ""}</p>
                    <p className="text-xs text-muted">{g.kind === "card" ? `${g.amount} €` : `${gp?.name} · ${g.tier} · ${g.months}×`}{g.to ? ` · ${g.to}` : ""} · {new Date(g.createdAt).toLocaleDateString(lang)}</p>
                  </div>
                  <button className="chip" onClick={() => navigator.clipboard?.writeText(link)}>{t("gift.copy")}</button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
