"use client";

import { personas } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import PersonaCard from "./PersonaCard";

/** Podobné persony podle shody kategorií (a pak podle popularity). */
export default function SimilarPersonas({ id }: { id: string }) {
  const { suspendedPersonas } = useStore();
  const t = useT();
  const me = personas.find((p) => p.id === id)!;
  const list = personas
    .filter((p) => p.id !== id && !suspendedPersonas.includes(p.id))
    .map((p) => ({ p, score: p.categories.filter((c) => me.categories.includes(c)).length * 10 + p.subscribers / 10000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return (
    <section className="mt-12 px-2 sm:px-6">
      <h2 className="mb-4 font-display text-3xl">{t("saved.similar")}</h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map(({ p }) => <PersonaCard key={p.id} p={p} />)}</div>
    </section>
  );
}
