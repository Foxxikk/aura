"use client";

import { levels, loyalty } from "@/lib/loyalty";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function Rewards() {
  const store = useStore();
  const t = useT();
  if (!store.ready) return null;
  const { lang } = store;
  const l = loyalty(store);
  const pct = l.next ? Math.round(((l.points - l.level.min) / (l.next.min - l.level.min)) * 100) : 100;
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    return { key, on: store.visitDays.includes(key), label: d.toLocaleDateString(lang, { weekday: "narrow" }) };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="font-display text-5xl">{t("rewards.title")}</h1>

      <div className="card grain relative overflow-hidden p-8" style={{ background: `linear-gradient(135deg, ${l.level.color}33, #1c1418 60%)` }}>
        <p className="text-sm text-muted">{t("rewards.points", { n: l.points.toLocaleString(lang) })}</p>
        <p className="font-display text-6xl" style={{ color: l.level.color }}>◆ {l.level.name[lang]}</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/30">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.next?.color ?? l.level.color }} />
        </div>
        <p className="mt-2 text-sm text-muted">{l.next ? t("rewards.next", { n: (l.next.min - l.points).toLocaleString(lang), level: l.next.name[lang] }) : t("rewards.max")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {levels.map((lv) => (
          <div key={lv.id} className={`card p-4 ${lv.id === l.level.id ? "border-gold" : ""}`}>
            <p className="font-semibold" style={{ color: lv.color }}>◆ {lv.name[lang]}</p>
            <p className="text-xs text-muted">{lv.min.toLocaleString(lang)}+</p>
            <ul className="mt-2 space-y-1 text-xs text-muted">{lv.perks[lang].map((x) => <li key={x}>· {x}</li>)}</ul>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-semibold">{t("rewards.streak")}</h2>
          <p className="mt-1 font-display text-3xl">{t("rewards.streakDays", { n: l.streak })}</p>
          <div className="mt-4 grid grid-cols-14 gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
            {days.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1">
                <div className={`h-6 w-full rounded ${d.on ? "bg-gold" : "bg-surface-2"}`} title={d.key} />
                <span className="text-[9px] text-muted">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">{t("rewards.how")}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {(["rewards.how1", "rewards.how2", "rewards.how3", "rewards.how4"] as const).map((k) => <li key={k}>· {t(k)}</li>)}
          </ul>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">{t("rewards.badges")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {l.badges.map((b) => (
            <div key={b.id} className={`rounded-xl border p-4 ${b.earned ? "border-gold/40 bg-gold/10" : "border-line opacity-50"}`}>
              <p className="text-2xl">{b.icon}</p>
              <p className="mt-1 text-sm font-semibold">{b.name[lang]}</p>
              <p className="text-xs text-muted">{b.desc[lang]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
