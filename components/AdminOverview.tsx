"use client";

import { useEffect, useState } from "react";
import { personaById, personas } from "@/lib/data";
import { useStore } from "@/lib/store";

type Stats = {
  users: { total: number; week: number };
  spend: { total: number; buyers: number };
  subs: number;
  byPersona: { persona: string; revenue: number }[];
  reports: { open: number; total: number };
  apps: { pending: number };
  push: number;
};

/** Přehled platformy pro majitele. S databází skutečná čísla, bez ní ukázková. */
export default function AdminOverview({ live }: { live: boolean }) {
  const { reports, applications } = useStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!live) return;
    fetch("/api/admin/stats").then(async (r) => (r.ok ? setStats(await r.json()) : setErr((await r.json()).error ?? "Chyba"))).catch(() => setErr("Chyba"));
  }, [live]);

  const demo: Stats = {
    users: { total: 1284, week: 163 },
    spend: { total: 18420, buyers: 412 },
    subs: 655,
    byPersona: personas.map((p, i) => ({ persona: p.id, revenue: [5090, 3870, 7310, 9120, 2640, 3310][i] })).sort((a, b) => b.revenue - a.revenue),
    reports: { open: reports.filter((r) => r.status === "open").length, total: reports.length },
    apps: { pending: applications.filter((a) => a.status === "pending").length },
    push: 0,
  };
  const s = live ? stats : demo;
  const fmt = (n: number) => Math.round(n).toLocaleString("cs-CZ");

  if (live && !s) return <p className="card p-8 text-center text-muted">{err || "Načítám…"}</p>;
  if (!s) return null;

  const platform = s.spend.total * 0.2;
  const funnel = [
    { label: "Návštěvy (odhad)", n: Math.max(s.users.total * 9, 1) },
    { label: "Registrace", n: s.users.total },
    { label: "Předplatné", n: s.subs },
    { label: "Platící fanoušci", n: s.spend.buyers },
  ];
  const maxRev = Math.max(1, ...s.byPersona.map((x) => x.revenue));

  return (
    <div className="space-y-6">
      {!live && <p className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-xs text-gold">Ukázková čísla. Po přihlášení administrátora s databází se zobrazí skutečná data.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Uživatelé", fmt(s.users.total), `+${fmt(s.users.week)} za 7 dní`],
          ["Obrat fanoušků", `${fmt(s.spend.total)} €`, `${fmt(s.spend.buyers)} platících`],
          ["Příjem platformy (20 %)", `${fmt(platform)} €`, `ARPPU ${s.spend.buyers ? fmt(s.spend.total / s.spend.buyers) : 0} €`],
          ["Aktivní předplatná", fmt(s.subs), `${s.push} zařízení s push`],
        ].map(([l, v, sub]) => (
          <div key={l} className="card p-5">
            <p className="text-xs text-muted">{l}</p>
            <p className="mt-1 font-display text-3xl">{v}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">Konverzní trychtýř</h2>
          <div className="mt-4 space-y-3">
            {funnel.map((f, i) => {
              const pct = Math.round((f.n / funnel[0].n) * 100);
              const step = i ? Math.round((f.n / Math.max(1, funnel[i - 1].n)) * 100) : 100;
              return (
                <div key={f.label}>
                  <div className="flex justify-between text-sm"><span>{f.label}</span><span className="text-muted">{fmt(f.n)}{i ? ` · ${step} % z předchozího` : ""}</span></div>
                  <div className="mt-1 h-3 rounded-full bg-surface-2"><div className="h-3 rounded-full bg-gradient-to-r from-gold to-rose" style={{ width: `${Math.max(2, pct)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Tržby podle persony</h2>
          {!s.byPersona.length ? <p className="mt-3 text-sm text-muted">Zatím žádné nákupy.</p> : (
            <div className="mt-4 space-y-2">
              {s.byPersona.map((x) => (
                <div key={x.persona} className="flex items-center gap-3 text-sm">
                  <span className="w-32 truncate">{personaById(x.persona)?.name ?? x.persona}</span>
                  <div className="h-3 flex-1 rounded bg-surface-2"><div className="h-3 rounded bg-[#d0507f]" style={{ width: `${(x.revenue / maxRev) * 100}%` }} /></div>
                  <span className="w-20 text-right">{fmt(x.revenue)} €</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-xs text-muted">Otevřená nahlášení</p><p className={`mt-1 font-display text-3xl ${s.reports.open ? "text-rose" : ""}`}>{s.reports.open}</p><p className="text-xs text-muted">z {s.reports.total} celkem</p></div>
        <div className="card p-5"><p className="text-xs text-muted">Žádosti tvůrců ke schválení</p><p className="mt-1 font-display text-3xl">{s.apps.pending}</p></div>
        <div className="card p-5"><p className="text-xs text-muted">Persony na platformě</p><p className="mt-1 font-display text-3xl">{personas.length}</p></div>
      </div>
    </div>
  );
}
