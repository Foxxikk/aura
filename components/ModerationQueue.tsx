"use client";

import { useCallback, useEffect, useState } from "react";
import { personaById, posts } from "@/lib/data";
import { type Report, useStore } from "@/lib/store";

const reasonLabel: Record<string, string> = {
  minor: "Nezletilí", realPerson: "Skutečná osoba", real_person: "Skutečná osoba", violence: "Násilí / nesouhlas",
  spam: "Spam / podvod", contact: "Kontakty mimo platformu", other: "Jiné",
};
const targetLabel: Record<Report["target"], string> = { post: "Příspěvek", message: "Zpráva", persona: "Profil persony", live: "Živá událost" };

/** Moderační fronta: nahlášení od fanoušků + zachycení automatickým filtrem. */
export default function ModerationQueue({ live }: { live: boolean }) {
  const { reports: localReports, hiddenPosts, suspendedPersonas, set } = useStore();
  const [remote, setRemote] = useState<Report[] | null>(null);
  const [filter, setFilter] = useState<"open" | "all">("open");

  const load = useCallback(async () => {
    const r = await fetch("/api/moderation");
    if (r.ok) setRemote((await r.json()).reports);
  }, []);
  useEffect(() => {
    if (live) load();
  }, [live, load]);

  const reports = live ? remote ?? [] : localReports;
  const list = reports.filter((r) => filter === "all" || r.status === "open");
  const prio = (r: Report) => (r.reason === "minor" ? 0 : r.reason === "violence" ? 1 : r.source === "auto" ? 2 : 3);

  async function decide(r: Report, status: Report["status"]) {
    if (live) {
      await fetch("/api/moderation", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, status, targetId: r.targetId, personaId: r.personaId }) });
      await load();
    }
    set((s) => ({
      reports: s.reports.map((x) => (x.id === r.id ? { ...x, status } : x)),
      hiddenPosts: status === "hidden" && r.target === "post" ? Array.from(new Set([...s.hiddenPosts, r.targetId])) : s.hiddenPosts,
      suspendedPersonas: status === "suspended" && r.personaId ? Array.from(new Set([...s.suspendedPersonas, r.personaId])) : s.suspendedPersonas,
    }));
  }

  async function undo(kind: "post" | "persona", id: string) {
    if (live) await fetch("/api/moderation", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ undo: id }) });
    set((s) => kind === "post" ? { hiddenPosts: s.hiddenPosts.filter((x) => x !== id) } : { suspendedPersonas: s.suspendedPersonas.filter((x) => x !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFilter("open")} className={`chip ${filter === "open" ? "border-gold text-gold" : ""}`}>Otevřené ({reports.filter((r) => r.status === "open").length})</button>
        <button onClick={() => setFilter("all")} className={`chip ${filter === "all" ? "border-gold text-gold" : ""}`}>Vše ({reports.length})</button>
        <span className="ml-auto text-xs text-muted">Cíl: vyřízení do 24 h (DSA). Nezletilí a násilí mají přednost.</span>
      </div>

      {!list.length && <p className="card p-8 text-center text-muted">Fronta je prázdná. Nahlášení vznikají tlačítkem ⚑ u příspěvků, zpráv a profilů a automatickým filtrem v chatu.</p>}

      {[...list].sort((a, b) => prio(a) - prio(b) || b.createdAt - a.createdAt).map((r) => {
        const persona = r.personaId ? personaById(r.personaId) : undefined;
        const post = r.target === "post" ? posts.find((x) => x.id === r.targetId) : undefined;
        return (
          <div key={r.id} className={`card p-5 ${r.reason === "minor" ? "border-rose/60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${r.reason === "minor" || r.reason === "violence" ? "border-rose/50 text-rose" : "text-gold"}`}>{reasonLabel[r.reason] ?? r.reason}</span>
                  <span className="chip">{targetLabel[r.target]}</span>
                  <span className="chip">{r.source === "auto" ? "Automatický filtr" : "Nahlásil fanoušek"}</span>
                  {r.status !== "open" && <span className="chip text-ok">{r.status === "kept" ? "Ponecháno" : r.status === "hidden" ? "Skryto" : "Persona pozastavena"}</span>}
                </div>
                <p className="mt-2 text-sm">{persona?.name ?? "—"}{post ? ` · ${post.caption}` : ""}</p>
                {r.excerpt && <p className="mt-1 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink/80">„{r.excerpt}“</p>}
                {r.note && <p className="mt-1 text-xs text-muted">Poznámka: {r.note}</p>}
                <p className="mt-1 text-xs text-muted">{new Date(r.createdAt).toLocaleString("cs-CZ")}</p>
              </div>
              {r.status === "open" && (
                <div className="flex flex-wrap gap-2">
                  <button className="btn-ghost" onClick={() => decide(r, "kept")}>Ponechat</button>
                  {r.target === "post" && <button className="btn-ghost" onClick={() => decide(r, "hidden")}>Skrýt příspěvek</button>}
                  {r.personaId && <button className="btn-primary" onClick={() => decide(r, "suspended")}>Pozastavit personu</button>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {(hiddenPosts.length > 0 || suspendedPersonas.length > 0) && (
        <div className="card p-5">
          <h3 className="font-semibold">Aktivní zásahy</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {hiddenPosts.map((id) => (
              <li key={id} className="flex justify-between gap-2"><span>Skrytý příspěvek: {posts.find((x) => x.id === id)?.caption ?? id}</span><button className="text-xs text-muted underline" onClick={() => undo("post", id)}>Obnovit</button></li>
            ))}
            {suspendedPersonas.map((id) => (
              <li key={id} className="flex justify-between gap-2"><span>Pozastavená persona: {personaById(id)?.name ?? id}</span><button className="text-xs text-muted underline" onClick={() => undo("persona", id)}>Obnovit</button></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
