"use client";

import { personas } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function Wallet() {
  const { balance, transactions, topUp, subscriptions, set, reset, ready } = useStore();
  if (!ready) return null;
  const subs = personas.filter((p) => subscriptions[p.id]);
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="font-display text-5xl">Peněženka</h1>
      <div className="card grain relative overflow-hidden p-8" style={{ background: "linear-gradient(135deg,#3a1a28,#1c1418 60%)" }}>
        <p className="text-sm text-muted">Zůstatek kreditu</p>
        <p className="font-display text-6xl">{balance.toFixed(2)} €</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {[10, 25, 50, 100].map((a) => (
            <button key={a} className="btn-ghost" onClick={() => topUp(a)}>+ {a} €</button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Demo: dobití je simulované. V produkci platba kartou přes bránu pro 18+ obsah (CCBill / Segpay).</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-3xl">Předplatné</h2>
        {!subs.length && <p className="text-sm text-muted">Žádné aktivní předplatné.</p>}
        <div className="space-y-2">
          {subs.map((p) => {
            const tier = p.tiers.find((t) => t.id === subscriptions[p.id])!;
            return (
              <div key={p.id} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{p.name} · {tier.name}</p>
                  <p className="text-xs text-muted">{tier.price} € / měsíc · obnovuje se automaticky</p>
                </div>
                <button className="btn-ghost" onClick={() => set((s) => { const n = { ...s.subscriptions }; delete n[p.id]; return { subscriptions: n }; })}>Zrušit</button>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-3xl">Historie</h2>
        <div className="card divide-y divide-line">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p>{t.label}</p>
                <p className="text-xs text-muted">{new Date(t.at).toLocaleString("cs-CZ")}</p>
              </div>
              <span className={t.amount > 0 ? "text-ok" : ""}>{t.amount > 0 ? "+" : ""}{t.amount.toFixed(2)} €</span>
            </div>
          ))}
        </div>
      </section>
      <button className="text-xs text-muted underline" onClick={reset}>Resetovat demo data</button>
    </div>
  );
}
