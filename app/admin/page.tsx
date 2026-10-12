"use client";

import { useState } from "react";
import type { Application } from "@/lib/data";
import { useStore } from "@/lib/store";

const statusLabel: Record<Application["status"], string> = {
  pending: "Čeká",
  approved: "Schválen",
  rejected: "Zamítnut",
  suspended: "Pozastaven",
};

export default function Admin() {
  const { applications, set, ready } = useStore();
  const [filter, setFilter] = useState<Application["status"] | "all">("pending");
  if (!ready) return null;

  function update(id: string, status: Application["status"]) {
    let note: string | undefined;
    if (status === "rejected" || status === "suspended") {
      note = prompt("Důvod (uvidí ho tvůrce):") ?? undefined;
      if (note === undefined) return;
    }
    set((s) => ({ applications: s.applications.map((a) => (a.id === id ? { ...a, status, note } : a)) }));
  }

  const list = applications.filter((a) => filter === "all" || a.status === filter);
  const counts = (st: Application["status"]) => applications.filter((a) => a.status === st).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Administrace</p>
          <h1 className="font-display text-5xl">Schvalování tvůrců</h1>
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected", "suspended", "all"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? "border-gold text-gold" : ""}`}>
              {s === "all" ? "Vše" : `${statusLabel[s]} (${counts(s)})`}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {!list.length && <p className="text-muted">Žádné žádosti v tomto stavu.</p>}
        {list.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{a.personaName}</h3>
                  <span className="text-sm text-muted">· {a.studio} · {a.country}</span>
                  <span className={`chip ${a.kyc === "verified" ? "border-ok/40 text-ok" : "border-gold/40 text-gold"}`}>
                    KYC {a.kyc === "verified" ? "ověřeno" : "čeká"}
                  </span>
                  <span className="chip">{statusLabel[a.status]}</span>
                </div>
                <p className="mt-2 text-sm text-ink/85">{a.concept}</p>
                <p className="mt-2 text-xs text-muted">{a.categories.join(", ")} · {a.email} · podáno {a.submittedAt}</p>
                {a.note && <p className="mt-2 text-xs text-rose">Důvod: {a.note}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {a.status !== "approved" && (
                  <button className="btn-primary" disabled={a.kyc !== "verified"} title={a.kyc !== "verified" ? "Nejdřív musí proběhnout KYC" : ""} onClick={() => update(a.id, "approved")}>Schválit</button>
                )}
                {a.status === "pending" && <button className="btn-ghost" onClick={() => update(a.id, "rejected")}>Zamítnout</button>}
                {a.status === "approved" && <button className="btn-ghost" onClick={() => update(a.id, "suspended")}>Pozastavit</button>}
                {(a.status === "rejected" || a.status === "suspended") && <button className="btn-ghost" onClick={() => update(a.id, "pending")}>Vrátit do fronty</button>}
              </div>
            </div>
            {a.status === "pending" && (
              <div className="mt-4 grid gap-2 rounded-xl bg-surface-2 p-3 text-xs text-muted sm:grid-cols-4">
                <span>☐ Persona nepřipomíná reálnou osobu</span>
                <span>☐ Zjevně dospělá</span>
                <span>☐ Ukázkový obsah v pořádku</span>
                <span>☐ Smlouva podepsána</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted">Demo: v produkci je admin chráněn přihlášením s 2FA a akce se logují.</p>
    </div>
  );
}
