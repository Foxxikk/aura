"use client";

import { personas } from "@/lib/data";
import { type Consents, useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function Privacy() {
  const store = useStore();
  const { consents, memory, chats, set, reset, user, dbEnabled, refreshUser, ready, lang } = store;
  const t = useT();
  if (!ready) return null;

  const withMemory = personas.filter((p) => memory[p.id] && (memory[p.id].name || memory[p.id].facts.length));
  const chatCount = Object.values(chats).flat().filter((m) => m.from !== "system").length;

  function exportData() {
    const { applications, scheduled, ...data } = store;
    void applications; void scheduled;
    const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => typeof v !== "function"));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), account: user?.email ?? null, data: clean }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `aura-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function deleteAccount() {
    if (!confirm(t("privacy.deleteConfirm"))) return;
    if (user && dbEnabled) await fetch("/api/account", { method: "DELETE" });
    reset();
    await refreshUser();
    alert(t("privacy.deleted"));
  }

  const toggles: (keyof Consents)[] = ["personalization", "aiMemory", "marketing", "analytics"];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-5xl">{t("privacy.title")}</h1>
      <p className="text-muted">{t("privacy.lead")}</p>

      <div className="card p-6">
        <h2 className="font-semibold">{t("privacy.consents")}</h2>
        <div className="mt-3 divide-y divide-line">
          {toggles.map((k) => (
            <label key={k} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>{t(`privacy.${k}`)}</span>
              <input type="checkbox" className="h-5 w-5 accent-[#e9b18a]" checked={consents[k]} onChange={(e) => set((s) => ({ consents: { ...s.consents, [k]: e.target.checked } }))} />
            </label>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">{t("privacy.memory")}</h2>
        {!withMemory.length ? <p className="mt-2 text-sm text-muted">{t("privacy.memoryEmpty")}</p> : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {withMemory.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{[memory[p.id].name && `${t("chat.memName")}: ${memory[p.id].name}`, ...memory[p.id].facts].filter(Boolean).join(" · ")}</p>
                </div>
                <button className="shrink-0 text-xs text-muted underline" onClick={() => set((s) => ({ memory: { ...s.memory, [p.id]: { facts: [] } } }))}>{t("saved.remove")}</button>
              </li>
            ))}
          </ul>
        )}
        {withMemory.length > 0 && <button className="btn-ghost mt-3" onClick={() => set(() => ({ memory: {} }))}>{t("privacy.clearMemory")}</button>}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">{t("privacy.data")}</h2>
        <p className="mt-1 text-sm text-muted">{t("privacy.stored")}: {t("privacy.storedList")}</p>
        <p className="mt-2 text-xs text-muted">{t("privacy.items", { n: chatCount })} · {store.transactions.length} tx · {new Date().toLocaleDateString(lang)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={exportData}>⬇ {t("privacy.export")}</button>
          <button className="btn-ghost" onClick={() => { if (confirm(t("privacy.deleteConfirm"))) set(() => ({ chats: {}, scheduled: [], unread: {} })); }}>{t("privacy.clearChats")}</button>
          <button className="btn-ghost border-rose/50 text-rose" onClick={deleteAccount}>{t("privacy.deleteAccount")}</button>
        </div>
      </div>
    </div>
  );
}
