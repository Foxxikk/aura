"use client";

import Link from "next/link";
import { useState } from "react";
import { offers, personas, posts } from "@/lib/data";
import { Avatar, MediaTile } from "@/components/Visuals";

// Demo: přihlášený tvůrce je studio Northlight s personou Elena Voss.
const persona = personas[0];

const weeks = [
  { w: "T37", subs: 1840, ppv: 920, tips: 210, chat: 640 },
  { w: "T38", subs: 1910, ppv: 1180, tips: 260, chat: 790 },
  { w: "T39", subs: 1990, ppv: 1050, tips: 240, chat: 860 },
  { w: "T40", subs: 2080, ppv: 1420, tips: 310, chat: 1010 },
  { w: "T41", subs: 2150, ppv: 1530, tips: 290, chat: 1120 },
];

export default function Creator() {
  const [tab, setTab] = useState<"overview" | "persona" | "content" | "offers">("overview");
  const [card, setCard] = useState({
    personality: persona.personality,
    writingStyle: persona.writingStyle,
    boundaries: persona.boundaries,
    wake: persona.schedule.wake,
    sleep: persona.schedule.sleep,
  });
  const [saved, setSaved] = useState(false);
  const max = Math.max(...weeks.map((w) => w.subs + w.ppv + w.tips + w.chat));
  const last = weeks[weeks.length - 1];
  const gross = last.subs + last.ppv + last.tips + last.chat;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <Avatar p={persona} size={56} />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted">Studio {persona.creatorStudio}</p>
          <h1 className="font-display text-4xl">{persona.name}</h1>
        </div>
        <Link href={`/c/${persona.handle}`} className="btn-ghost">Zobrazit profil</Link>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line">
        {([["overview", "Přehled"], ["persona", "Persona a chat"], ["content", "Obsah"], ["offers", "Nabídky"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm ${tab === k ? "border-gold" : "border-transparent text-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Hrubý příjem (týden)", `${gross.toLocaleString("cs-CZ")} €`],
              ["Tvůj podíl 80 %", `${Math.round(gross * 0.8).toLocaleString("cs-CZ")} €`],
              ["Předplatitelé", persona.subscribers.toLocaleString("cs-CZ")],
              ["Odpovědí AI chatu", "12 480"],
            ].map(([l, v]) => (
              <div key={l} className="card p-5">
                <p className="text-xs text-muted">{l}</p>
                <p className="mt-1 font-display text-3xl">{v}</p>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Příjmy podle zdroje, posledních 5 týdnů (€)</h2>
              <div className="flex gap-3 text-xs text-muted">
                {[["Předplatné", "bg-gold"], ["PPV", "bg-rose"], ["Chat", "bg-[#8a6cd1]"], ["Tipy", "bg-ok"]].map(([l, c]) => (
                  <span key={l} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-sm ${c}`} />{l}</span>
                ))}
              </div>
            </div>
            <div className="flex h-56 items-end gap-4">
              {weeks.map((w) => (
                <div key={w.w} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full max-w-16 flex-col-reverse overflow-hidden rounded-md" style={{ height: `${((w.subs + w.ppv + w.tips + w.chat) / max) * 100}%` }}>
                    <div className="bg-gold" style={{ flex: w.subs }} />
                    <div className="bg-rose" style={{ flex: w.ppv }} />
                    <div className="bg-[#8a6cd1]" style={{ flex: w.chat }} />
                    <div className="bg-ok" style={{ flex: w.tips }} />
                  </div>
                  <span className="text-xs text-muted">{w.w}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Ilustrační data pro demo.</p>
          </div>
        </div>
      )}

      {tab === "persona" && (
        <form className="card mt-6 space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          <p className="text-sm text-muted">Karta persony řídí, jak AI v chatu píše a jak rychle odpovídá. Persona se vždy prezentuje jako AI.</p>
          {([["personality", "Povaha"], ["writingStyle", "Styl psaní"], ["boundaries", "Hranice a zakázaná témata"]] as const).map(([k, l]) => (
            <label key={k} className="block">
              <span className="text-sm font-medium">{l}</span>
              <textarea className="input mt-1 min-h-20" value={card[k]} onChange={(e) => setCard({ ...card, [k]: e.target.value })} />
            </label>
          ))}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="text-sm font-medium">Vstává (hodina, {persona.timezone})</span>
              <input type="number" min={0} max={23} className="input mt-1" value={card.wake} onChange={(e) => setCard({ ...card, wake: +e.target.value })} /></label>
            <label className="block"><span className="text-sm font-medium">Jde spát (hodina)</span>
              <input type="number" min={0} max={24} className="input mt-1" value={card.sleep} onChange={(e) => setCard({ ...card, sleep: +e.target.value })} /></label>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> VIP fanoušci dostávají rychlejší odpovědi</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> AI smí v chatu nabízet PPV z mého vaultu</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Upozorni mě, když chce fanoušek převzetí chatu člověkem</label>
          <button className="btn-primary">{saved ? "Uloženo ✓" : "Uložit kartu persony"}</button>
          <p className="text-xs text-muted">Demo: změny se neukládají na server.</p>
        </form>
      )}

      {tab === "content" && (
        <div className="mt-6">
          <div className="card mb-6 border-dashed p-8 text-center">
            <p className="font-semibold">Nahrát nový obsah</p>
            <p className="mt-1 text-sm text-muted">Obrázky a videa projdou automatickou kontrolou a ruční moderací. Metadata o AI původu (C2PA) se přidají automaticky.</p>
            <button className="btn-ghost mt-4" onClick={() => alert("V MVP není nahrávání zapojené – v produkci S3 + moderace.")}>Vybrat soubory</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {posts.filter((x) => x.personaId === persona.id).map((x) => (
              <div key={x.id} className="card overflow-hidden">
                <MediaTile hue={x.hue} className="aspect-square" />
                <div className="p-2 text-xs">
                  <p className="truncate">{x.caption}</p>
                  <p className="text-muted">{x.access === "free" ? "Zdarma" : x.access === "subscribers" ? "Předplatitelé" : `PPV ${x.price} €`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "offers" && (
        <div className="mt-6 space-y-3">
          {offers.filter((o) => o.personaId === persona.id).map((o) => (
            <div key={o.id} className="card flex items-center justify-between gap-4 p-5">
              <div>
                <h3 className="font-semibold">{o.title}</h3>
                <p className="text-sm text-muted">{o.description}</p>
              </div>
              <span className="font-display text-2xl text-gold">{o.price} €</span>
            </div>
          ))}
          <button className="btn-ghost" onClick={() => alert("Editor nabídek přijde v další iteraci.")}>+ Nová nabídka</button>
        </div>
      )}
    </div>
  );
}
