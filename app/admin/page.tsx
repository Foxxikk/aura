"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ModerationQueue from "@/components/ModerationQueue";
import PushSender from "@/components/PushSender";
import AdminOverview from "@/components/AdminOverview";
import type { Application } from "@/lib/data";
import { useStore } from "@/lib/store";

const statusLabel: Record<Application["status"], string> = {
  pending: "Čeká",
  approved: "Schválen",
  rejected: "Zamítnut",
  suspended: "Pozastaven",
};

export default function Admin() {
  const { applications: localApps, set, ready, dbEnabled, user, reports } = useStore();
  const openReports = reports.filter((r) => r.status === "open").length;
  const [filter, setFilter] = useState<Application["status"] | "all">("pending");
  const [remote, setRemote] = useState<Application[] | null>(null);
  const [section, setSection] = useState<"overview" | "apps" | "moderation" | "push">("overview");
  const live = dbEnabled && user?.role === "admin";

  const load = useCallback(async () => {
    const r = await fetch("/api/applications");
    if (r.ok) setRemote((await r.json()).applications);
  }, []);
  useEffect(() => {
    if (live) load();
  }, [live, load]);

  if (!ready) return null;
  if (dbEnabled && user?.role !== "admin") {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <h1 className="font-display text-4xl">Administrace</h1>
        <p className="mt-2 text-sm text-muted">Přístup jen pro administrátory. Přihlas se účtem, jehož e-mail je v proměnné ADMIN_EMAILS.</p>
        <Link href="/login" className="btn-primary mt-6">Přihlásit se</Link>
      </div>
    );
  }
  const applications = live ? remote ?? [] : localApps;

  async function update(id: string, status: Application["status"]) {
    let note: string | undefined;
    if (status === "rejected" || status === "suspended") {
      note = prompt("Důvod (uvidí ho tvůrce):") ?? undefined;
      if (note === undefined) return;
    }
    if (live) {
      await fetch("/api/applications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status, note }) });
      return load();
    }
    set((s) => ({ applications: s.applications.map((a) => (a.id === id ? { ...a, status, note } : a)) }));
  }

  async function verifyKyc(id: string) {
    if (live) {
      const a = applications.find((x) => x.id === id)!;
      await fetch("/api/applications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status: a.status, kyc: "verified" }) });
      return load();
    }
    set((s) => ({ applications: s.applications.map((a) => (a.id === id ? { ...a, kyc: "verified" } : a)) }));
  }

  const list = applications.filter((a) => filter === "all" || a.status === filter);
  const counts = (st: Application["status"]) => applications.filter((a) => a.status === st).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">Administrace</p>
          <h1 className="font-display text-5xl">{section === "overview" ? "Přehled platformy" : section === "apps" ? "Schvalování tvůrců" : section === "moderation" ? "Moderace" : "Notifikace"}</h1>
        </div>
        {section === "apps" && <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "suspended", "all"] as const).map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`chip ${filter === s ? "border-gold text-gold" : ""}`}>
              {s === "all" ? "Vše" : `${statusLabel[s]} (${counts(s)})`}
            </button>
          ))}
        </div>}
      </div>

      <div className="mt-4 flex gap-2 border-b border-line">
        {([["overview", "Přehled"], ["apps", "Žádosti tvůrců"], ["moderation", `Moderace${openReports ? ` (${openReports})` : ""}`], ["push", "Notifikace"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setSection(k)} className={`-mb-px border-b-2 px-4 py-2 text-sm ${section === k ? "border-gold" : "border-transparent text-muted"}`}>{l}</button>
        ))}
      </div>

      {section === "overview" && <div className="mt-6"><AdminOverview live={live} /></div>}
      {section === "moderation" && <div className="mt-6"><ModerationQueue live={live} /></div>}
      {section === "push" && <div className="mt-6"><PushSender live={live} /></div>}

      {section === "apps" && <div className="mt-6 space-y-3">
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
                  {a.kyc !== "verified" && <button className="text-xs text-gold underline" onClick={() => verifyKyc(a.id)}>Simulovat ověření KYC</button>}
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
      </div>}
      {section === "apps" && <p className="mt-6 text-xs text-muted">{live ? "Žádosti se načítají z databáze; každé rozhodnutí se ukládá s e-mailem administrátora." : "Demo režim: žádosti jsou uložené jen v tomto prohlížeči. Po připojení databáze je admin chráněn přihlášením."}</p>}
    </div>
  );
}
