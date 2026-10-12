"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";

const steps = ["Koncept", "Povaha a chat", "Ceník", "Pravidla a obsah", "Náhled a odeslání"];

export default function Onboarding() {
  const { set, dbEnabled } = useStore();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [f, setF] = useState({
    studio: "", email: "", country: "", name: "", age: 27, location: "", categories: "", concept: "",
    tagline: "", bio: "", personality: "", writingStyle: "", boundaries: "",
    fan: 9, vip: 24, ppv: 9, wake: 8, sleep: 24,
  });
  const [rules, setRules] = useState([false, false, false, false, false]);
  const up = (k: keyof typeof f, v: string | number) => setF({ ...f, [k]: v });

  async function generate() {
    setBusy(true); setErr("");
    const r = await fetch("/api/persona-card", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    setF({ ...f, tagline: j.tagline, bio: j.bio, personality: j.personality, writingStyle: j.writingStyle, boundaries: j.boundaries });
  }

  async function submit() {
    const app = { studio: f.studio, personaName: f.name, email: f.email, country: f.country, concept: `${f.age} let, ${f.location}. ${f.concept}`, categories: f.categories.split(",").map((c) => c.trim()).filter(Boolean) };
    if (dbEnabled) {
      const r = await fetch("/api/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...app, card: { tagline: f.tagline, bio: f.bio, personality: f.personality, writingStyle: f.writingStyle, boundaries: f.boundaries, pricing: { fan: f.fan, vip: f.vip, ppv: f.ppv }, schedule: { wake: f.wake, sleep: f.sleep } } }) });
      if (!r.ok) return setErr("Odeslání se nezdařilo.");
    } else {
      set((s) => ({ applications: [{ id: crypto.randomUUID(), ...app, submittedAt: new Date().toISOString().slice(0, 10), kyc: "pending", status: "pending" }, ...s.applications] }));
    }
    setDone(true);
  }

  const canNext = [
    f.studio && f.email.includes("@") && f.name && f.age >= 25 && f.concept.length > 20,
    f.personality && f.writingStyle && f.boundaries,
    f.fan > 0 && f.vip > f.fan,
    rules.every(Boolean),
    true,
  ][step];

  if (done)
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <h1 className="font-display text-4xl">Odesláno ke schválení</h1>
        <p className="mt-3 text-sm text-muted">Ozveme se do 72 hodin. Mezitím tě čeká ověření identity (doklad + selfie). Po schválení se persona {f.name} objeví na platformě.</p>
        <Link href="/creator" className="btn-ghost mt-6">Do sekce Pro tvůrce</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl">Nová persona</h1>
      <p className="mt-2 text-muted">Průvodce tě provede od nápadu po odeslání ke schválení. Trvá asi 10 minut.</p>
      <ol className="mt-6 flex gap-2 overflow-x-auto">
        {steps.map((s, i) => (
          <li key={s} className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs ${i === step ? "bg-gold text-[#1a0f12]" : i < step ? "bg-surface-2 text-ok" : "bg-surface-2 text-muted"}`}>
            <span>{i < step ? "✓" : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      <div className="card mt-6 space-y-4 p-6">
        {step === 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Studio / tvůrce"><input className="input" value={f.studio} onChange={(e) => up("studio", e.target.value)} /></Field>
              <Field label="Kontaktní e-mail"><input className="input" type="email" value={f.email} onChange={(e) => up("email", e.target.value)} /></Field>
              <Field label="Jméno persony"><input className="input" value={f.name} onChange={(e) => up("name", e.target.value)} /></Field>
              <Field label="Věk persony (min. 25)"><input className="input" type="number" min={25} value={f.age} onChange={(e) => up("age", +e.target.value)} /></Field>
              <Field label="Kde žije"><input className="input" value={f.location} onChange={(e) => up("location", e.target.value)} /></Field>
              <Field label="Země sídla studia"><input className="input" value={f.country} onChange={(e) => up("country", e.target.value)} /></Field>
            </div>
            <Field label="Kategorie (oddělené čárkou)"><input className="input" placeholder="Cestování, Fotografie" value={f.categories} onChange={(e) => up("categories", e.target.value)} /></Field>
            <Field label="Koncept a příběh persony"><textarea className="input min-h-28" placeholder="Kdo je, čím žije, jaký obsah bude sdílet…" value={f.concept} onChange={(e) => up("concept", e.target.value)} /></Field>
            {f.age < 25 && <p className="text-xs text-rose">Persony na platformě musí být zjevně dospělé (25+).</p>}
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">Karta persony řídí, jak AI píše v chatu. Nech si ji navrhnout a pak uprav.</p>
              <button type="button" className="btn-primary" onClick={generate} disabled={busy}>{busy ? "Navrhuji…" : "✨ Navrhnout pomocí AI"}</button>
            </div>
            {err && <p className="text-sm text-rose">{err}</p>}
            <Field label="Krátký popis (tagline)"><input className="input" value={f.tagline} onChange={(e) => up("tagline", e.target.value)} /></Field>
            <Field label="Bio na profil"><textarea className="input min-h-20" value={f.bio} onChange={(e) => up("bio", e.target.value)} /></Field>
            <Field label="Povaha"><textarea className="input min-h-16" value={f.personality} onChange={(e) => up("personality", e.target.value)} /></Field>
            <Field label="Styl psaní"><textarea className="input min-h-16" value={f.writingStyle} onChange={(e) => up("writingStyle", e.target.value)} /></Field>
            <Field label="Hranice a zakázaná témata"><textarea className="input min-h-16" value={f.boundaries} onChange={(e) => up("boundaries", e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vstává (hodina)"><input className="input" type="number" min={0} max={23} value={f.wake} onChange={(e) => up("wake", +e.target.value)} /></Field>
              <Field label="Jde spát (hodina)"><input className="input" type="number" min={0} max={24} value={f.sleep} onChange={(e) => up("sleep", +e.target.value)} /></Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted">Doporučené ceny vychází z person podobné kategorie na platformě. Tvůj podíl je 80 %.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Úroveň Fan (€/měs)"><input className="input" type="number" min={3} value={f.fan} onChange={(e) => up("fan", +e.target.value)} /></Field>
              <Field label="Úroveň VIP (€/měs)"><input className="input" type="number" min={5} value={f.vip} onChange={(e) => up("vip", +e.target.value)} /></Field>
              <Field label="Typická cena PPV (€)"><input className="input" type="number" min={2} value={f.ppv} onChange={(e) => up("ppv", +e.target.value)} /></Field>
            </div>
            <div className="rounded-xl bg-surface-2 p-4 text-sm">
              <p className="font-medium">Odhad měsíčního příjmu při 300 předplatitelích (20 % VIP, 2 PPV na fanouška):</p>
              <p className="mt-1 font-display text-3xl text-gold">{Math.round((240 * f.fan + 60 * f.vip + 300 * 2 * f.ppv * 0.15) * 0.8).toLocaleString("cs-CZ")} €</p>
              <p className="text-xs text-muted">Ilustrační výpočet po provizi platformy, předpoklad 15 % konverze PPV.</p>
            </div>
            {f.vip <= f.fan && <p className="text-xs text-rose">VIP musí být dražší než Fan.</p>}
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-muted">Bez souhlasu se všemi pravidly nejde personu odeslat. Porušení vede k okamžitému pozastavení.</p>
            {[
              "Persona je fiktivní a nepodobá se žádné skutečné osobě bez jejího písemného souhlasu.",
              "Persona je zjevně dospělá (25+) a obsah nikdy nepůsobí jako nezletilý.",
              "Persona i obsah budou označeny jako AI a persona v chatu nikdy netvrdí, že je člověk.",
              "Mám práva ke všem modelům a podkladům, které používám.",
              "Beru na vědomí ruční moderaci obsahu a automatickou kontrolu chatu.",
            ].map((r, i) => (
              <label key={r} className="flex gap-2 text-sm">
                <input type="checkbox" checked={rules[i]} onChange={(e) => setRules(rules.map((x, j) => (j === i ? e.target.checked : x)))} /> {r}
              </label>
            ))}
            <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">
              Ukázkový obsah (3–5 obrázků) nahraješ po schválení identity. V MVP se nahrávání nesimuluje.
            </div>
          </>
        )}

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2"><h2 className="font-display text-3xl">{f.name}</h2><span className="ai-badge">AI Creator</span></div>
            <p className="text-muted">{f.tagline}</p>
            <p>{f.bio}</p>
            <p className="text-xs text-muted">Fan {f.fan} € · VIP {f.vip} € · PPV kolem {f.ppv} € · aktivní {f.wake}–{f.sleep} h</p>
            <details className="rounded-xl bg-surface-2 p-3"><summary className="cursor-pointer">Karta persony pro AI</summary>
              <p className="mt-2"><b>Povaha:</b> {f.personality}</p><p><b>Styl:</b> {f.writingStyle}</p><p><b>Hranice:</b> {f.boundaries}</p>
            </details>
            {err && <p className="text-rose">{err}</p>}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button className="btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Zpět</button>
          {step < steps.length - 1 ? (
            <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Pokračovat</button>
          ) : (
            <button className="btn-primary" onClick={submit}>Odeslat ke schválení</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm"><span className="font-medium">{label}</span><div className="mt-1">{children}</div></label>;
}
