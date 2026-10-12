"use client";

import Link from "next/link";
import { personas } from "@/lib/data";
import PersonaCard from "@/components/PersonaCard";
import { StoriesRow } from "@/components/Stories";
import EventBanner from "@/components/EventBanner";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export default function Home() {
  const t = useT();
  const { suspendedPersonas } = useStore();
  const featured = [...personas].filter((p) => !suspendedPersonas.includes(p.id)).sort((a, b) => b.subscribers - a.subscribers).slice(0, 3);
  return (
    <div className="space-y-12">
      <StoriesRow />
      <section className="grain relative overflow-hidden rounded-3xl border border-line px-6 py-16 sm:px-12 sm:py-24"
        style={{ background: "radial-gradient(ellipse at 15% 20%, #6b2a45 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, #7a4a2c 0%, transparent 50%), #140f13" }}>
        <span className="ai-badge">{t("home.badge")}</span>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] sm:text-7xl">
          {t("home.title1")} <i className="text-gold">{t("home.title2")}</i> {t("home.title3")}
        </h1>
        <p className="mt-5 max-w-xl text-muted">{t("home.lead")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/explore" className="btn-primary">{t("home.cta")}</Link>
          <Link href="/creator/apply" className="btn-ghost">{t("home.creator")}</Link>
        </div>
      </section>

      <EventBanner />

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-4xl">{t("home.top")}</h2>
          <Link href="/explore" className="text-sm text-gold">{t("home.all")}</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <PersonaCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {(["f1", "f2", "f3"] as const).map((k) => (
          <div key={k} className="card p-6">
            <h3 className="font-display text-2xl">{t(`home.${k}.t`)}</h3>
            <p className="mt-2 text-sm text-muted">{t(`home.${k}.d`)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
