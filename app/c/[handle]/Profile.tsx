"use client";

import Link from "next/link";
import { useState } from "react";
import { offers, personaByHandle, posts } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, Cover } from "@/components/Visuals";
import PostCard from "@/components/PostCard";
import { PresenceDot } from "@/components/PersonaCard";

export default function Profile({ handle }: { handle: string }) {
  const p = personaByHandle(handle)!;
  const { subscriptions, spend, set } = useStore();
  const [tab, setTab] = useState<"posts" | "offers">("posts");
  const current = subscriptions[p.id];
  const myPosts = posts.filter((x) => x.personaId === p.id);
  const myOffers = offers.filter((o) => o.personaId === p.id);

  function subscribe(tierId: string, price: number, name: string) {
    if (!spend(price, `Předplatné ${name} – ${p.name}`)) return alert("Nedostatek kreditu – dobij si peněženku.");
    set((s) => ({ subscriptions: { ...s.subscriptions, [p.id]: tierId } }));
  }

  function buyOffer(id: string, price: number, title: string) {
    if (!spend(price, `${title} – ${p.name}`)) return alert("Nedostatek kreditu – dobij si peněženku.");
    alert("Zakoupeno. Tvůrce obsah doručí do zpráv (v produkci).");
    void id;
  }

  return (
    <div>
      <Cover p={p} className="h-52 rounded-3xl sm:h-72" />
      <div className="relative px-2 sm:px-6">
        <div className="-mt-14 flex flex-wrap items-end gap-4">
          <Avatar p={p} size={112} ring />
          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-4xl">{p.name}</h1>
              <span className="ai-badge">AI Creator</span>
            </div>
            <p className="text-sm text-muted">
              @{p.handle} · {p.location} · <PresenceDot p={p} />
            </p>
          </div>
          {current ? (
            <Link href={`/messages/${p.handle}`} className="btn-primary">Napsat zprávu</Link>
          ) : (
            <a href="#tiers" className="btn-primary">Předplatit</a>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-ink/85">{p.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.categories.map((c) => <span key={c} className="chip">{c}</span>)}
            </div>
            <p className="mt-3 text-xs text-muted">
              {p.postsCount} příspěvků · {p.subscribers.toLocaleString("cs-CZ")} předplatitelů · Persona od studia {p.creatorStudio}
            </p>

            <div className="mt-8 flex gap-2 border-b border-line">
              {(["posts", "offers"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === t ? "border-gold text-ink" : "border-transparent text-muted"}`}>
                  {t === "posts" ? "Příspěvky" : "Nabídky"}
                </button>
              ))}
            </div>

            {tab === "posts" ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {myPosts.map((post) => <PostCard key={post.id} post={post} persona={p} />)}
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {myOffers.map((o) => (
                  <div key={o.id} className="card flex items-center justify-between gap-4 p-5">
                    <div>
                      <span className="chip mb-2">{o.type === "bundle" ? "Balíček" : o.type === "custom" ? "Na přání" : "Akce"}</span>
                      <h3 className="font-semibold">{o.title}</h3>
                      <p className="text-sm text-muted">{o.description}</p>
                    </div>
                    <button className="btn-primary shrink-0" onClick={() => buyOffer(o.id, o.price, o.title)}>{o.price} €</button>
                  </div>
                ))}
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
                </ul>
                {current === t.id ? (
                  <p className="mt-4 text-center text-sm text-ok">Aktivní předplatné</p>
                ) : (
                  <button className="btn-ghost mt-4 w-full" onClick={() => subscribe(t.id, t.price, t.name)}>
                    {current ? "Přejít na tuto úroveň" : "Předplatit"}
                  </button>
                )}
              </div>
            ))}
            <p className="px-1 text-xs text-muted">Chat i obsah generuje AI v charakteru persony, kterou vytvořilo studio {p.creatorStudio}.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
