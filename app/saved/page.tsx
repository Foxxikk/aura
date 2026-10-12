"use client";

import { useState } from "react";
import { personas, posts } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import PostCard from "@/components/PostCard";

export default function Saved() {
  const { saved, collections, set, ready } = useStore();
  const t = useT();
  const [active, setActive] = useState<string>("all");
  const [name, setName] = useState("");
  if (!ready) return null;
  const col = collections.find((c) => c.id === active);
  const ids = active === "all" ? saved : col?.postIds ?? [];
  const list = ids.map((id) => posts.find((x) => x.id === id)).filter(Boolean) as typeof posts;

  return (
    <div>
      <h1 className="font-display text-5xl">{t("saved.title")}</h1>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button onClick={() => setActive("all")} className={`chip ${active === "all" ? "border-gold text-gold" : ""}`}>{t("saved.all")} ({saved.length})</button>
        {collections.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} className={`chip ${active === c.id ? "border-gold text-gold" : ""}`}>{c.name} ({c.postIds.length})</button>
        ))}
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; const id = crypto.randomUUID(); set((s) => ({ collections: [...s.collections, { id, name: name.trim(), postIds: [] }] })); setName(""); setActive(id); }}>
          <input className="input w-44 py-1.5" placeholder={t("saved.newCollection")} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="chip" disabled={!name.trim()}>+ {t("saved.create")}</button>
        </form>
      </div>

      {!list.length && <p className="card mt-8 p-8 text-center text-muted">{t("saved.empty")}</p>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((post) => {
          const persona = personas.find((p) => p.id === post.personaId)!;
          return (
            <div key={post.id} className="space-y-2">
              <PostCard post={post} persona={persona} />
              <div className="flex items-center gap-2 text-xs">
                {collections.length > 0 && active === "all" && (
                  <select className="input py-1 text-xs" value="" onChange={(e) => { const cid = e.target.value; set((s) => ({ collections: s.collections.map((c) => (c.id === cid && !c.postIds.includes(post.id) ? { ...c, postIds: [...c.postIds, post.id] } : c)) })); }}>
                    <option value="">{t("saved.addTo")}…</option>
                    {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {col && <button className="text-muted underline" onClick={() => set((s) => ({ collections: s.collections.map((c) => (c.id === col.id ? { ...c, postIds: c.postIds.filter((x) => x !== post.id) } : c)) }))}>{t("saved.remove")}</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
