"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";

export default function Apply() {
  const { set, dbEnabled } = useStore();
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ studio: "", personaName: "", email: "", country: "", concept: "", categories: "" });
  const [checks, setChecks] = useState([false, false, false, false]);
  const rules = [
    "Persona je fiktivní a nepodobá se žádné skutečné osobě bez jejího písemného souhlasu.",
    "Persona je zjevně dospělá (25+) a obsah nikdy nepůsobí jako nezletilý.",
    "Souhlasím s označením persony i obsahu jako AI.",
    "Mám práva ke všem modelům a podkladům, které používám.",
  ];

  if (done)
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="font-display text-4xl">Žádost odeslána</h1>
        <p className="mt-3 text-sm text-muted">Ozveme se do 72 hodin. V produkci tě teď čeká ověření identity (doklad + selfie).</p>
      </div>
    );

  const valid = f.studio && f.personaName && f.email && f.concept && checks.every(Boolean);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-5xl">Staň se tvůrcem</h1>
      <a href="/creator/onboarding" className="mt-4 block rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold">✨ Nově: průvodce založením persony s návrhem karty pomocí AI →</a>
      <p className="mt-2 text-muted">Aura je kurátorská platforma – každé studio a personu schvalujeme ručně. Získáš hosting, platby, AI chat v charakteru persony a 80 % z příjmů.</p>
      <form
        className="card mt-8 space-y-4 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (dbEnabled) {
            const r = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, categories: f.categories.split(",").map((c) => c.trim()).filter(Boolean) }) });
            if (!r.ok) return alert("Odeslání se nezdařilo, zkus to prosím znovu.");
            return setDone(true);
          }
          set((s) => ({
            applications: [
              {
                id: crypto.randomUUID(), ...f,
                categories: f.categories.split(",").map((c) => c.trim()).filter(Boolean),
                submittedAt: new Date().toISOString().slice(0, 10), kyc: "pending", status: "pending",
              },
              ...s.applications,
            ],
          }));
          setDone(true);
        }}
      >
        {([["studio", "Název studia / tvůrce"], ["personaName", "Jméno persony"], ["email", "E-mail"], ["country", "Země sídla"], ["categories", "Kategorie (oddělené čárkou)"]] as const).map(([k, l]) => (
          <label key={k} className="block">
            <span className="text-sm font-medium">{l}</span>
            <input className="input mt-1" type={k === "email" ? "email" : "text"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </label>
        ))}
        <label className="block">
          <span className="text-sm font-medium">Koncept persony (věk, příběh, styl obsahu)</span>
          <textarea className="input mt-1 min-h-28" value={f.concept} onChange={(e) => setF({ ...f, concept: e.target.value })} />
        </label>
        <div className="space-y-2 rounded-xl bg-surface-2 p-4">
          {rules.map((r, i) => (
            <label key={r} className="flex gap-2 text-sm">
              <input type="checkbox" checked={checks[i]} onChange={(e) => setChecks(checks.map((c, j) => (j === i ? e.target.checked : c)))} />
              {r}
            </label>
          ))}
        </div>
        <button className="btn-primary w-full" disabled={!valid}>Odeslat žádost</button>
      </form>
    </div>
  );
}
