"use client";

import Link from "next/link";
import type { Persona } from "@/lib/data";
import { Avatar, Cover } from "./Visuals";
import { presence } from "@/lib/realism";
import { useEffect, useState } from "react";

export function PresenceDot({ p }: { p: Persona }) {
  const [pr, setPr] = useState<ReturnType<typeof presence> | null>(null);
  useEffect(() => setPr(presence(p)), [p]);
  if (!pr) return null;
  const color = pr.tone === "online" ? "bg-ok" : pr.tone === "away" ? "bg-gold" : "bg-muted";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {pr.label}
    </span>
  );
}

export default function PersonaCard({ p }: { p: Persona }) {
  return (
    <Link href={`/c/${p.handle}`} className="card group overflow-hidden transition hover:-translate-y-0.5 hover:border-gold/40">
      <Cover p={p} className="h-36" />
      <div className="relative px-4 pb-4">
        <div className="-mt-8 flex items-end justify-between">
          <Avatar p={p} size={64} ring />
          {p.isNew && <span className="chip border-gold/40 text-gold">Nová</span>}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <h3 className="font-semibold">{p.name}</h3>
          <span className="ai-badge">AI Creator</span>
        </div>
        <p className="text-xs text-muted">@{p.handle}</p>
        <p className="mt-2 line-clamp-2 text-sm text-ink/80">{p.tagline}</p>
        <div className="mt-3 flex items-center justify-between">
          <PresenceDot p={p} />
          <span className="text-sm">
            od <b className="text-gold">{p.tiers[0].price} €</b>/měs
          </span>
        </div>
      </div>
    </Link>
  );
}
