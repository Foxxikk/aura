"use client";

import Link from "next/link";
import { type Season } from "@/lib/narrative";
import { personaById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Avatar } from "./Visuals";

export default function SeasonView({ season }: { season: Season }) {
  const { lang, subscriptions, seasonVotes, set } = useStore();
  const t = useT();
  const p = personaById(season.personaId)!;
  const sub = !!subscriptions[p.id];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <Avatar p={p} size={40} />
        <div>
          <p className="text-xs text-muted">{p.name}</p>
          <h3 className="font-display text-2xl">{season.title[lang]}</h3>
        </div>
      </div>
      <ol className="mt-4 space-y-3">
        {season.episodes.map((e) => {
          const locked = e.subscribersOnly && !sub;
          const voteKey = `${season.id}:${e.id}`;
          const mine = seasonVotes[voteKey];
          const votes = e.poll ? e.poll.base.map((b, i) => b + (mine === i ? 1 : 0)) : [];
          const total = votes.reduce((a, b) => a + b, 0);
          return (
            <li key={e.id} className={`rounded-xl border p-4 ${e.status === "current" ? "border-gold/50 bg-gold/5" : "border-line"} ${e.status === "upcoming" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted">{t("seasons.episode", { n: e.n })}</span>
                {e.status === "current" && <span className="chip border-gold/40 text-gold">{t("seasons.current")}</span>}
                {e.status === "upcoming" && <span className="chip">{t("seasons.upcoming")}</span>}
                {locked && <span className="chip">🔒 {t("seasons.subsOnly")}</span>}
              </div>
              <p className="mt-1 font-semibold">{e.title[lang]}</p>
              <p className={`mt-1 text-sm text-muted ${locked ? "select-none blur-sm" : ""}`}>{e.summary[lang]}</p>
              {e.poll && e.status === "past" && e.winner !== undefined && (
                <p className="mt-2 text-xs text-gold">{t("seasons.winner", { o: e.poll.options[e.winner][lang] })}</p>
              )}
              {e.poll && e.status === "current" && (
                <div className="mt-3">
                  <p className="text-sm">{t("seasons.vote")}: <b>{e.poll.q[lang]}</b></p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {e.poll.options.map((o, i) => {
                      const pct = Math.round((votes[i] / total) * 100);
                      return (
                        <button key={i} disabled={locked} onClick={() => set((s) => ({ seasonVotes: { ...s.seasonVotes, [voteKey]: i } }))}
                          className={`relative overflow-hidden rounded-xl border px-3 py-2 text-left text-sm disabled:opacity-50 ${mine === i ? "border-gold" : "border-line"}`}>
                          <span className="absolute inset-y-0 left-0 bg-gold/15" style={{ width: mine !== undefined ? `${pct}%` : 0 }} />
                          <span className="relative flex justify-between gap-2"><span>{o[lang]}</span>{mine !== undefined && <span className="text-muted">{pct} %</span>}</span>
                        </button>
                      );
                    })}
                  </div>
                  {mine !== undefined && <p className="mt-2 text-xs text-ok">{t("seasons.voted")}</p>}
                  {locked && <Link href={`/c/${p.handle}#tiers`} className="mt-2 inline-block text-xs text-gold underline">{t("profile.subscribe")}</Link>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
