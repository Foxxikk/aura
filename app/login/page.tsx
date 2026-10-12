"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Login() {
  const { user, dbEnabled, refreshUser, ready, referralCode, referredBy } = useStore();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, ageConfirmed: age, referralCode, referredBy }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? "Něco se pokazilo.");
    await refreshUser();
    router.push("/explore");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refreshUser();
  }

  if (!ready) return null;

  if (user)
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <h1 className="font-display text-4xl">Účet</h1>
        <p className="mt-2 text-sm text-muted">Přihlášen jako <b className="text-ink">{user.email}</b>{user.role === "admin" ? " · administrátor" : ""}</p>
        <p className="mt-2 text-xs text-muted">Předplatná, chaty, paměť person i peněženka se ukládají do databáze a máš je na všech zařízeních.</p>
        <button className="btn-ghost mt-6" onClick={logout}>Odhlásit se</button>
      </div>
    );

  return (
    <div className="mx-auto mt-6 max-w-md">
      <div className="card p-8">
        <div className="mb-6 flex gap-2 rounded-full bg-surface-2 p-1">
          {(["login", "register"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-2 text-sm ${mode === m ? "bg-surface text-ink" : "text-muted"}`}>
              {m === "login" ? "Přihlášení" : "Registrace"}
            </button>
          ))}
        </div>
        {!dbEnabled && (
          <p className="mb-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-gold">
            Databáze zatím není připojená, aplikace běží v demo režimu a data se ukládají jen v tomto prohlížeči. Po připojení Postgresu ve Vercelu (proměnná DATABASE_URL) začnou účty fungovat.
          </p>
        )}
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input className="input" type="password" placeholder={mode === "register" ? "Heslo (min. 8 znaků)" : "Heslo"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "register" ? "new-password" : "current-password"} />
          {mode === "register" && (
            <label className="flex items-start gap-2 text-xs text-muted">
              <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} className="mt-0.5" />
              Potvrzuji, že mi je 18 let, a beru na vědomí, že všechny persony i obsah jsou generované AI.
            </label>
          )}
          {error && <p className="text-sm text-rose">{error}</p>}
          <button className="btn-primary w-full" disabled={busy || !dbEnabled || !email || !password || (mode === "register" && !age)}>
            {busy ? "…" : mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
          </button>
        </form>
        {mode === "register" && <p className="mt-4 text-[11px] text-muted">V produkci po registraci následuje ověření věku přes externího poskytovatele.</p>}
      </div>
    </div>
  );
}
