"use client";

import { useState } from "react";

export default function Pin() {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  async function submit(value: string) {
    setErr("");
    const r = await fetch("/api/pin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin: value }) });
    if (!r.ok) { setErr((await r.json().catch(() => ({}))).error ?? "Chyba"); setPin(""); return; }
    const next = new URLSearchParams(window.location.search).get("next") || "/";
    window.location.href = next.startsWith("/") ? next : "/";
  }
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg p-4">
      <form className="card w-full max-w-xs p-8 text-center" onSubmit={(e) => { e.preventDefault(); submit(pin); }}>
        <p className="font-display text-5xl italic">aura<span className="text-gold">.</span></p>
        <p className="mt-3 text-sm text-muted">Testovací verze. Zadej PIN.</p>
        <input autoFocus inputMode="numeric" maxLength={8} className="input mt-5 text-center text-2xl tracking-[0.5em]" value={pin}
          onChange={(e) => { const v = e.target.value.replace(/\D/g, ""); setPin(v); if (v.length === 4) submit(v); }} />
        {err && <p className="mt-3 text-sm text-rose">{err}</p>}
        <button className="btn-primary mt-5 w-full" disabled={!pin}>Vstoupit</button>
      </form>
    </div>
  );
}
