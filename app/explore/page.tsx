"use client";

import { useMemo, useState } from "react";
import { allCategories, personas } from "@/lib/data";
import PersonaCard from "@/components/PersonaCard";
import { StoriesRow } from "@/components/Stories";
import EventBanner from "@/components/EventBanner";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function Explore() {
  const t = useT();
  const { suspendedPersonas } = useStore();
  const [cat, setCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"popular" | "new" | "price">("popular");

  const list = useMemo(() => {
    let l = personas.filter(
      (p) =>
        !suspendedPersonas.includes(p.id) &&
        (!cat || p.categories.includes(cat)) &&
        (!q || (p.name + p.tagline + p.handle).toLowerCase().includes(q.toLowerCase()))
    );
    if (sort === "popular") l = [...l].sort((a, b) => b.subscribers - a.subscribers);
    if (sort === "new") l = [...l].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    if (sort === "price") l = [...l].sort((a, b) => a.tiers[0].price - b.tiers[0].price);
    return l;
  }, [cat, q, sort, suspendedPersonas]);

  return (
    <div>
      <h1 className="font-display text-5xl">{t("explore.title")}</h1>
      <div className="mt-6"><StoriesRow /></div>
      <div className="mt-4"><EventBanner /></div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder={t("explore.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-48" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
          <option value="popular">{t("explore.popular")}</option>
          <option value="new">{t("explore.new")}</option>
          <option value="price">{t("explore.cheap")}</option>
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setCat(null)} className={`chip ${!cat ? "border-gold text-gold" : ""}`}>{t("explore.all")}</button>
        {allCategories.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`chip ${cat === c ? "border-gold text-gold" : ""}`}>{c}</button>
        ))}
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => <PersonaCard key={p.id} p={p} />)}
      </div>
      {!list.length && <p className="mt-10 text-muted">{t("explore.none")}</p>}
    </div>
  );
}
