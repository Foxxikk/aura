"use client";

import Link from "next/link";
import { liveEvents, personaById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Avatar, Cover } from "@/components/Visuals";

function fmtIn(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h} h ${min % 60} min` : `${Math.floor(h / 24)} d ${h % 24} h`;
}

export default function Live() {
  const { lang, eventReminders, set, suspendedPersonas, ready } = useStore();
  const t = useT();
  if (!ready) return null;
  const list = liveEvents.filter((e) => !suspendedPersonas.includes(e.personaId));
  const now = list.filter((e) => e.startsInMin <= 0 && e.startsInMin + e.durationMin > 0);
  const upcoming = list.filter((e) => e.startsInMin > 0).sort((a, b) => a.startsInMin - b.startsInMin);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl">{t("live.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("live.lead")}</p>
      </div>
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-rose" />{t("live.now")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {now.map((e) => {
            const p = personaById(e.personaId)!;
            return (
              <Link key={e.id} href={`/live/${e.id}`} className="card overflow-hidden hover:border-gold/40">
                <Cover p={p} className="h-32" />
                <div className="flex items-center gap-3 p-4">
                  <Avatar p={p} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{e.title[lang]}</p>
                    <p className="text-xs text-muted">{p.name} · {e.price ? t("live.ticket", { p: e.price }) : t("live.free")}</p>
                  </div>
                  <span className="btn-primary">{t("live.join")}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-sm font-semibold">{t("live.upcoming")}</h2>
        <div className="space-y-3">
          {upcoming.map((e) => {
            const p = personaById(e.personaId)!;
            const on = eventReminders.includes(e.id);
            return (
              <div key={e.id} className="card flex flex-wrap items-center gap-4 p-4">
                <Avatar p={p} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{e.title[lang]}</p>
                  <p className="text-xs text-muted">{p.name} · {t("live.in", { t: fmtIn(e.startsInMin) })} · {e.price ? t("live.ticket", { p: e.price }) : t("live.free")}</p>
                </div>
                <button className={on ? "chip text-ok" : "btn-ghost"} onClick={() => set((s) => ({ eventReminders: on ? s.eventReminders.filter((x) => x !== e.id) : [...s.eventReminders, e.id] }))}>
                  {on ? t("live.reminded") : `🔔 ${t("live.remind")}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
