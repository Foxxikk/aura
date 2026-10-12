"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { liveEvents, personaById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { loyalty } from "@/lib/loyalty";
import { checkText, modLabels } from "@/lib/moderation";
import { Avatar, Cover } from "@/components/Visuals";
import ReportButton from "@/components/ReportButton";

type Line = { id: string; who: string; text: string; kind: "fan" | "me" | "persona" | "system" };

const demoFans = ["marek_88", "jiri.k", "lukas_photo", "tomas.v", "petr.n", "ondra", "filip_z", "adam.r"];
const fanLines: Record<"cs" | "en" | "de", string[]> = {
  cs: ["ahoj ze Zlína 👋", "jaký máš dneska den?", "ten poslední set byl super", "zdravím všechny", "budeš dělat víc takových večerů?", "🔥🔥", "co teď posloucháš?", "díky za stream"],
  en: ["hi from Zlín 👋", "how's your day?", "that last set was amazing", "hello everyone", "will you do more nights like this?", "🔥🔥", "what are you listening to?", "thanks for the stream"],
  de: ["hallo aus Zlín 👋", "wie ist dein Tag?", "das letzte Set war super", "hallo zusammen", "machst du öfter solche Abende?", "🔥🔥", "was hörst du gerade?", "danke für den Stream"],
};

export default function Room({ id }: { id: string }) {
  const ev = liveEvents.find((e) => e.id === id)!;
  const p = personaById(ev.personaId)!;
  const store = useStore();
  const { lang, subscriptions, eventJoined, eventVotes, set, spend, ready, memory } = store;
  const t = useT();
  const [lines, setLines] = useState<Line[]>([]);
  const [q, setQ] = useState("");
  const [viewers, setViewers] = useState(180 + Math.round(Math.random() * 120));
  const listRef = useRef<HTMLDivElement>(null);
  const live = ev.startsInMin <= 0 && ev.startsInMin + ev.durationMin > 0;
  const platinum = ready && loyalty(store).level.id === "platinum";
  const joined = eventJoined.includes(ev.id) || (ev.price === 0 && !!subscriptions[p.id]) || platinum;
  const myName = memory[p.id]?.name ?? "Ty";

  useEffect(() => {
    if (!joined || !live) return;
    setLines([{ id: "s", who: "", kind: "system", text: `${p.name} · ${ev.title[lang]}` }]);
    const tm = setInterval(() => {
      setViewers((v) => Math.max(120, v + Math.round(Math.random() * 10 - 4)));
      setLines((l) => [...l.slice(-60), { id: crypto.randomUUID(), who: demoFans[Math.floor(Math.random() * demoFans.length)], kind: "fan", text: fanLines[lang][Math.floor(Math.random() * fanLines[lang].length)] }]);
    }, 3500);
    return () => clearInterval(tm);
  }, [joined, live, lang, p.name, ev.title]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [lines.length]);

  async function ask() {
    const text = q.trim();
    if (!text) return;
    const check = checkText(text);
    if (!check.ok) return alert(t("chat.blocked", { reason: modLabels[check.category][lang] }));
    setQ("");
    setLines((l) => [...l, { id: crypto.randomUUID(), who: myName, kind: "me", text }]);
    const res = await fetch("/api/chat", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ personaId: p.id, mode: "group", lang, history: [{ from: "fan", text: `${myName}: ${text}` }] }),
    }).then((r) => r.json()).catch(() => ({ replies: ["🙂"] }));
    setTimeout(() => setLines((l) => [...l, { id: crypto.randomUUID(), who: p.name, kind: "persona", text: `@${myName} ${res.replies?.[0] ?? "🙂"}` }]), 2500 + Math.random() * 2500);
  }

  function buy() {
    if (!spend(ev.price, `Vstupenka: ${ev.title.cs} (${p.name})`, { personaId: p.id, kind: "ppv", ref: ev.id })) return alert(t("credit.low"));
    set((s) => ({ eventJoined: [...s.eventJoined, ev.id] }));
  }

  if (!ready) return null;
  const votes = ev.poll.base.map((b, i) => b + (eventVotes[ev.id] === i ? 1 : 0));
  const total = votes.reduce((a, b) => a + b, 0);

  if (!live) return <div className="card mx-auto mt-10 max-w-md p-8 text-center">{ev.startsInMin > 0 ? t("live.in", { t: `${ev.startsInMin} min` }) : t("live.ended")}<br /><Link href="/live" className="btn-ghost mt-4">←</Link></div>;

  if (!joined)
    return (
      <div className="card mx-auto mt-10 max-w-md overflow-hidden text-center">
        <Cover p={p} className="h-32" />
        <div className="p-8">
          <h1 className="font-display text-3xl">{ev.title[lang]}</h1>
          <p className="mt-2 text-sm text-muted">{p.name} · {t("live.watching", { n: viewers })}</p>
          {ev.price ? <button className="btn-primary mt-6" onClick={buy}>{t("live.ticket", { p: ev.price })}</button> : <Link href={`/c/${p.handle}#tiers`} className="btn-primary mt-6">{t("profile.subscribe")}</Link>}
        </div>
      </div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="card flex h-[calc(100vh-11rem)] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Avatar p={p} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{ev.title[lang]}</p>
            <p className="flex items-center gap-2 text-xs text-muted"><span className="h-2 w-2 animate-pulse rounded-full bg-rose" />LIVE · {t("live.watching", { n: viewers })}</p>
          </div>
          <ReportButton target="live" targetId={ev.id} personaId={p.id} excerpt={ev.title.cs} />
        </div>
        <div ref={listRef} className="flex-1 space-y-1.5 overflow-y-auto px-4 py-3 text-sm">
          {lines.map((l) => l.kind === "system" ? (
            <p key={l.id} className="py-2 text-center text-xs text-muted">{l.text}</p>
          ) : (
            <p key={l.id} className={l.kind === "persona" ? "rounded-xl bg-gold/10 px-3 py-2" : ""}>
              <b className={l.kind === "persona" ? "text-gold" : l.kind === "me" ? "text-rose" : "text-muted"}>{l.who}{l.kind === "persona" ? " · AI" : ""}</b> {l.text}
            </p>
          ))}
        </div>
        <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input className="input" placeholder={t("live.ask")} value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-primary" disabled={!q.trim()}>{t("chat.send")}</button>
        </form>
      </div>
      <aside className="space-y-4">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-wider text-muted">{t("live.poll")}</p>
          <p className="mt-1 font-semibold">{ev.poll.q[lang]}</p>
          <div className="mt-3 space-y-2">
            {ev.poll.options.map((o, i) => {
              const pct = Math.round((votes[i] / total) * 100);
              const mine = eventVotes[ev.id] === i;
              return (
                <button key={i} onClick={() => set((s) => ({ eventVotes: { ...s.eventVotes, [ev.id]: i } }))} className={`relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left text-sm ${mine ? "border-gold" : "border-line"}`}>
                  <span className="absolute inset-y-0 left-0 bg-gold/15" style={{ width: `${pct}%` }} />
                  <span className="relative flex justify-between"><span>{o[lang]}{mine ? " ✓" : ""}</span><span className="text-muted">{pct} %</span></span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{t("live.votes", { n: total })}</p>
        </div>
        <p className="px-1 text-xs text-muted">{t("live.demoFans")}</p>
      </aside>
    </div>
  );
}
