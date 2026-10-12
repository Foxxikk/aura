"use client";

import Link from "next/link";
import { useState } from "react";
import { bundlePrice, currentEvent, offers, personaByHandle, posts } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Cover, MediaTile } from "@/components/Visuals";
import PostCard from "@/components/PostCard";
import { PresenceDot } from "@/components/PersonaCard";
import { StoryAvatar, StoryViewer } from "@/components/Stories";
import TipGoal from "@/components/TipGoal";
import EventBanner from "@/components/EventBanner";

const statusLabel = {
  requested: "Čeká na přijetí",
  accepted: "Přijato",
  in_progress: "Ve výrobě",
  delivered: "Doručeno do zpráv",
  declined: "Odmítnuto (záloha vrácena)",
} as const;

export default function Profile({ handle }: { handle: string }) {
  const p = personaByHandle(handle)!;
  const { subscriptions, spend, set, bundles, unlocked, customRequests } = useStore();
  const [tab, setTab] = useState<"posts" | "bundles" | "custom">("posts");
  const [storyOpen, setStoryOpen] = useState(false);
  const [req, setReq] = useState({ topic: "", style: "", size: "45" });
  const current = subscriptions[p.id];
  const myPosts = posts.filter((x) => x.personaId === p.id);
  const myBundles = bundles.filter((b) => b.personaId === p.id);
  const discountOffer = offers.find((o) => o.personaId === p.id && o.type === "discount");
  const myRequests = customRequests.filter((r) => r.personaId === p.id);

  function subscribe(tierId: string, price: number, name: string) {
    if (!spend(price, `Předplatné ${name} – ${p.name}`, { personaId: p.id, kind: "sub", ref: tierId })) return alert("Nedostatek kreditu – dobij si peněženku.");
    set((s) => ({ subscriptions: { ...s.subscriptions, [p.id]: tierId }, subscribedAt: { ...s.subscribedAt, [p.id]: s.subscribedAt[p.id] ?? Date.now() } }));
  }

  function buyBundle(id: string) {
    const b = myBundles.find((x) => x.id === id)!;
    const { price } = bundlePrice(b, currentEvent.bundleDiscount);
    if (!spend(price, `Balíček: ${b.title} (${p.name})`, { personaId: p.id, kind: "bundle", ref: b.id })) return alert("Nedostatek kreditu – dobij si peněženku.");
    set((s) => ({ unlocked: Array.from(new Set([...s.unlocked, ...b.postIds])) }));
  }

  function submitRequest() {
    const price = Number(req.size);
    const deposit = Math.round(price / 2);
    if (!spend(deposit, `Záloha custom požadavku – ${p.name}`, { personaId: p.id, kind: "custom" })) return alert("Nedostatek kreditu – dobij si peněženku.");
    set((s) => ({
      customRequests: [
        { id: crypto.randomUUID(), personaId: p.id, topic: req.topic, style: req.style, price, deposit, status: "requested", createdAt: Date.now() },
        ...s.customRequests,
      ],
    }));
    setReq({ topic: "", style: "", size: "45" });
  }

  return (
    <div>
      <EventBanner />
      <Cover p={p} className="mt-4 h-52 rounded-3xl sm:h-72" />
      <div className="relative px-2 sm:px-6">
        <div className="-mt-14 flex flex-wrap items-end gap-4">
          <StoryAvatar p={p} size={104} onOpen={() => setStoryOpen(true)} />
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-4xl">{p.name}</h1>
              <span className="ai-badge">AI Creator</span>
            </div>
            <p className="text-sm text-muted">@{p.handle} · {p.location} · <PresenceDot p={p} /></p>
          </div>
          {current ? <Link href={`/messages/${p.handle}`} className="btn-primary">Napsat zprávu</Link> : <a href="#tiers" className="btn-primary">Předplatit</a>}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-ink/85">{p.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">{p.categories.map((c) => <span key={c} className="chip">{c}</span>)}</div>
            <p className="mt-3 text-xs text-muted">
              {p.postsCount} příspěvků · {p.subscribers.toLocaleString("cs-CZ")} předplatitelů · Persona od studia {p.creatorStudio}
            </p>

            <div className="mt-8 flex gap-2 overflow-x-auto border-b border-line">
              {([["posts", "Příspěvky"], ["bundles", `Balíčky (${myBundles.length})`], ["custom", "Na přání"]] as const).map(([t, l]) => (
                <button key={t} onClick={() => setTab(t)} className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm ${tab === t ? "border-gold text-ink" : "border-transparent text-muted"}`}>{l}</button>
              ))}
            </div>

            {tab === "posts" && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {myPosts.map((post) => <PostCard key={post.id} post={post} persona={p} />)}
              </div>
            )}

            {tab === "bundles" && (
              <div className="mt-6 space-y-3">
                {myBundles.map((b) => {
                  const { full, price } = bundlePrice(b, currentEvent.bundleDiscount);
                  const owned = b.postIds.every((id) => unlocked.includes(id));
                  return (
                    <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
                      <div className="grid w-40 grid-cols-3 gap-1">
                        {b.postIds.slice(0, 3).map((id) => <MediaTile key={id} hue={posts.find((x) => x.id === id)?.hue ?? 0} locked={!unlocked.includes(id)} className="aspect-square rounded-md" />)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{b.title}</h3>
                        <p className="text-sm text-muted">{b.postIds.length} položek · balíčková sleva −{b.discount} % · {currentEvent.title} −{currentEvent.bundleDiscount} %</p>
                      </div>
                      {owned ? <span className="text-sm text-ok">Odemčeno</span> : (
                        <button className="btn-primary" onClick={() => buyBundle(b.id)}>
                          <s className="opacity-60">{full} €</s> {price} €
                        </button>
                      )}
                    </div>
                  );
                })}
                {discountOffer && (
                  <div className="card flex items-center justify-between gap-4 p-4">
                    <div><span className="chip mb-2">Akce</span><h3 className="font-semibold">{discountOffer.title}</h3><p className="text-sm text-muted">{discountOffer.description}</p></div>
                    <button className="btn-ghost" onClick={() => subscribe("vip", discountOffer.price, "VIP (akce)")}>{discountOffer.price} €</button>
                  </div>
                )}
              </div>
            )}

            {tab === "custom" && (
              <div className="mt-6 space-y-4">
                <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); submitRequest(); }}>
                  <h3 className="font-display text-2xl">Set na přání</h3>
                  <p className="text-sm text-muted">Popiš téma a styl. Studio {p.creatorStudio} požadavek posoudí, vygeneruje set a doručí ho do zpráv. Platíš 50 % předem, zbytek při doručení. Odmítnutý požadavek = vrácená záloha.</p>
                  <input className="input" placeholder="Téma (např. podzimní procházka v parku)" value={req.topic} onChange={(e) => setReq({ ...req, topic: e.target.value })} />
                  <input className="input" placeholder="Styl, barvy, nálada" value={req.style} onChange={(e) => setReq({ ...req, style: e.target.value })} />
                  <select className="input" value={req.size} onChange={(e) => setReq({ ...req, size: e.target.value })}>
                    <option value="45">Malý set · 5 fotek · 45 €</option>
                    <option value="75">Velký set · 12 fotek · 75 €</option>
                    <option value="120">Set + krátké video · 120 €</option>
                  </select>
                  <button className="btn-primary w-full" disabled={!req.topic.trim()}>Odeslat a zaplatit zálohu {Math.round(Number(req.size) / 2)} €</button>
                  <p className="text-[11px] text-muted">Požadavky se kontrolují podle pravidel platformy (žádné reálné osoby, nic explicitního mimo pravidla).</p>
                </form>
                {myRequests.length > 0 && (
                  <div className="card divide-y divide-line">
                    {myRequests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.topic}</p>
                          <p className="text-xs text-muted">{r.price} € · záloha {r.deposit} € · {new Date(r.createdAt).toLocaleDateString("cs-CZ")}</p>
                        </div>
                        <span className={`chip shrink-0 ${r.status === "delivered" ? "border-ok/40 text-ok" : r.status === "declined" ? "text-rose" : "text-gold"}`}>{statusLabel[r.status]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside id="tiers" className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            {p.tiers.map((t) => (
              <div key={t.id} className={`card p-5 ${current === t.id ? "border-gold" : ""}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">{t.name}</h3>
                  <p><b className="text-xl text-gold">{t.price} €</b><span className="text-xs text-muted">/měs</span></p>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {t.perks.map((x) => <li key={x}>· {x}</li>)}
                  {t.id === "vip" && <li>· Hlasové zprávy od persony</li>}
                </ul>
                {current === t.id ? <p className="mt-4 text-center text-sm text-ok">Aktivní předplatné</p> : (
                  <button className="btn-ghost mt-4 w-full" onClick={() => subscribe(t.id, t.price, t.name)}>{current ? "Přejít na tuto úroveň" : "Předplatit"}</button>
                )}
              </div>
            ))}
            <TipGoal personaId={p.id} />
            <p className="px-1 text-xs text-muted">Chat i obsah generuje AI v charakteru persony, kterou vytvořilo studio {p.creatorStudio}.</p>
          </aside>
        </div>
      </div>
      {storyOpen && <StoryViewer personaId={p.id} onClose={() => setStoryOpen(false)} />}
    </div>
  );
}
