"use client";

import { useState } from "react";
import NotifyToggle from "./NotifyToggle";

/** Admin: odeslání push notifikace všem odběratelům (vyžaduje databázi a VAPID klíče). */
export default function PushSender({ live }: { live: boolean }) {
  const [title, setTitle] = useState("Nová živá událost");
  const [body, setBody] = useState("Mira je právě živě – přijď na Q&A!");
  const [url, setUrl] = useState("/live");
  const [result, setResult] = useState("");

  async function send() {
    const r = await fetch("/api/push/send", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, body, url }) });
    const j = await r.json().catch(() => ({}));
    setResult(r.ok ? `Odesláno ${j.sent} z ${j.total} zařízení.` : j.error ?? "Chyba");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="card space-y-3 p-6" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <h2 className="font-display text-2xl">Push notifikace</h2>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nadpis" />
        <textarea className="input min-h-20" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Text" />
        <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Odkaz po kliknutí" />
        <button className="btn-primary w-full" disabled={!live}>Odeslat všem odběratelům</button>
        {result && <p className="text-sm text-muted">{result}</p>}
        {!live && <p className="text-xs text-muted">Odesílání vyžaduje přihlášení administrátora s připojenou databází.</p>}
      </form>
      <div className="card space-y-3 p-6 text-sm text-muted">
        <h3 className="font-semibold text-ink">Jak to funguje</h3>
        <p>Fanoušek zapne upozornění v peněžence. Když je aplikace otevřená na pozadí, upozornění na nové zprávy fungují hned.</p>
        <p>Pro upozornění i při zavřené aplikaci (web push) je potřeba ve Vercelu nastavit dvojici VAPID klíčů: <code className="text-ink">NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> a <code className="text-ink">VAPID_PRIVATE_KEY</code>. Pak se zařízení přihlášených fanoušků ukládají do databáze a odsud jim jde poslat zpráva.</p>
        <NotifyToggle />
      </div>
    </div>
  );
}
