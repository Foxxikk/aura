"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type Persona, personaText } from "@/lib/data";
import { Avatar, Cover } from "./Visuals";
import { presence } from "@/lib/realism";
import { useT } from "@/lib/i18n";
import { useStore } from "@/lib/store";

export function PresenceDot({ p }: { p: Persona }) {
  const t = useT();
  const [pr, setPr] = useState<ReturnType<typeof presence> | null>(null);
  useEffect(() => setPr(presence(p)), [p]);
  if (!pr) return null;
  const color = pr.tone === "online" ? "bg-ok" : pr.tone === "away" ? "bg-gold" : "bg-muted";
  const label = pr.tone === "online" ? t("presence.online") : pr.tone === "sleep" ? t("presence.sleep") : t("presence.away", { n: pr.label.match(/\d+/)?.[0] ?? "5" });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

export default function PersonaCard({ p }: { p: Persona }) {
  const t = useT();
  const { lang } = useStore();
  return (
    <Link href={`/c/${p.handle}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-gold/40">
      <Cover p={p} className="h-36" />
      <div className="relative px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between">
          <Avatar p={p} size={64} ring />
          {p.isNew && <span className="chip border-gold/40 text-gold">{t("card.new")}</span>}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h3 className="font-semibold">{p.name}</h3>
          <span className="ai-badge">AI Creator</span>
        </div>
        <p className="text-xs text-muted">@{p.handle}</p>
        <p className="mt-2 line-clamp-2 text-sm text-ink/80">{personaText(p, lang).tagline}</p>
        <div className="mt-3 flex items-center justify-between">
          <PresenceDot p={p} />
          <span className="text-sm">
            {t("card.from")} <b className="text-gold">{p.tiers[0].price} €</b>{t("card.month")}
          </span>
        </div>
      </div>
    </Link>
  );
}
