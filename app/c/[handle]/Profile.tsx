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
import ReportButton from "@/components/ReportButton";
import SimilarPersonas from "@/components/SimilarPersonas";
import { useT } from "@/lib/i18n";
import { personaText } from "@/lib/data";
import { finalPrice, loyalty } from "@/lib/loyalty";
import { checkText, modLabels } from "@/lib/moderation";

export default function Profile({ handle }: { handle: string }) {
  const p = personaByHandle(handle)!;
  const store = useStore();
  const { subscriptions, spend, set, bundles, unlocked, customRequests, lang, suspendedPersonas } = store;
  const t = useT();
  const loyaltyOff = loyalty(store).level.discount;
  const text = personaText(p, lang);
  const [tab, setTab] = useState<"posts" | "bundles" | "custom">("posts");
  const [storyOpen, setStoryOpen] = useState(false);
  const [req, setReq] = useState({ topic: "", style: "", size: "45" });
  const current = subscriptions[p.id];
  const myPosts = posts.filter((x) => x.personaId === p.id);
  const myBundles = bundles.filter((b) => b.personaId === p.id);
  const discountOffer = offers.find((o) => o.personaId === p.id && o.type === "discount");
  const myRequests = customRequests.filter((r) => r.personaId === p.id);

  function subscribe(tierId: string, price: number, name: string) {
    if (!spend(price, `Předplatné ${name} – ${p.name}`, { personaId: p.id, kind: "sub", ref: tierId })) return alert(t("credit.low"));
    set((s) => ({ subscriptions: { ...s.subscriptions, [p.id]: tierId }, subscribedAt: { ...s.subscribedAt, [p.id]: s.subscribedAt[p.id] ?? Date.now() } }));
  }

  function buyBundle(id: string) {
    const b = myBundles.find((x) => x.id === id)!;
    const price = finalPrice(bundlePrice(b, currentEvent.bundleDiscount).price, { loyaltyDiscount: loyaltyOff });
    if (!spend(price, `Balíček: ${b.title} (${p.name})`, { personaId: p.id, kind: "bundle", ref: b.id })) return alert(t("credit.low"));
    set((s) => ({ unlocked: Array.from(new Set([...s.unlocked, ...b.postIds])) }));
  }

  function submitRequest() {
    const check = checkText(`${req.topic} ${req.style}`);
    if (!check.ok) {
      set((s) => ({ reports: [{ id: crypto.randomUUID(), target: "persona", targetId: p.id, personaId: p.id, reason: check.category, excerpt: req.topic.slice(0, 200), source: "auto", createdAt: Date.now(), status: "open" }, ...s.reports] }));
      return alert(t("chat.blocked", { reason: modLabels[check.category][lang] }));
    }
    const price = Number(req.size);
    const deposit = Math.round(price / 2);
    if (!spend(deposit, `Záloha custom požadavku – ${p.name}`, { personaId: p.id, kind: "custom" })) return alert(t("credit.low"));
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
      {suspendedPersonas.includes(p.id) && <p className="mb-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{t("suspended")}</p>}
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
          {current ? <Link href={`/messages/${p.handle}`} className="btn-primary">{t("profile.message")}</Link> : <a href="#tiers" className="btn-primary">{t("profile.subscribe")}</a>}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-ink/85">{text.bio}</p>
            <div className="mt-3 flex flex-wrap gap-2">{p.categories.map((c) => <span key={c} className="chip">{c}</span>)}</div>
            <p className="mt-3 text-xs text-muted">
              {t("profile.stats", { posts: p.postsCount, subs: p.subscribers.toLocaleString(lang), studio: p.creatorStudio })}
            </p>

            <div className="mt-8 flex gap-2 overflow-x-auto border-b border-line">
              {([["posts", t("profile.posts")], ["bundles", `${t("profile.bundles")} (${myBundles.length})`], ["custom", t("profile.custom")]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm ${tab === k ? "border-gold text-ink" : "border-transparent text-muted"}`}>{l}</button>
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
                  const { full, price: evPrice } = bundlePrice(b, currentEvent.bundleDiscount);
                  const price = finalPrice(evPrice, { loyaltyDiscount: loyaltyOff });
                  const owned = b.postIds.every((id) => unlocked.includes(id));
                  return (
                    <div key={b.id} className="card flex flex-wrap items-center gap-4 p-4">
                      <div className="grid w-40 grid-cols-3 gap-1">
                        {b.postIds.slice(0, 3).map((id) => <MediaTile key={id} seed={id} hue={posts.find((x) => x.id === id)?.hue ?? 0} locked={!unlocked.includes(id)} className="aspect-square rounded-md" />)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{b.title}</h3>
                        <p className="text-sm text-muted">{t("bundle.desc", { n: b.postIds.length, d: b.discount, event: t("event.title"), e: currentEvent.bundleDiscount })}{loyaltyOff ? ` · ${t("loyaltyOff", { n: loyaltyOff })}` : ""}</p>
                      </div>
                      {owned ? <span className="text-sm text-ok">{t("profile.unlocked")}</span> : (
                        <button className="btn-primary" onClick={() => buyBundle(b.id)}>
                          <s className="opacity-60">{full} €</s> {price} €
                        </button>
                      )}
                    </div>
                  );
                })}
                {discountOffer && (
                  <div className="card flex items-center justify-between gap-4 p-4">
                    <div><span className="chip mb-2">{t("promo")}</span><h3 className="font-semibold">{discountOffer.title}</h3><p className="text-sm text-muted">{discountOffer.description}</p></div>
                    <button className="btn-ghost" onClick={() => subscribe("vip", discountOffer.price, "VIP (akce)")}>{discountOffer.price} €</button>
                  </div>
                )}
              </div>
            )}

            {tab === "custom" && (
              <div className="mt-6 space-y-4">
                <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); submitRequest(); }}>
                  <h3 className="font-display text-2xl">{t("custom.title")}</h3>
                  <p className="text-sm text-muted">{t("custom.desc", { studio: p.creatorStudio })}</p>
                  <input className="input" placeholder={t("custom.topic")} value={req.topic} onChange={(e) => setReq({ ...req, topic: e.target.value })} />
                  <input className="input" placeholder={t("custom.style")} value={req.style} onChange={(e) => setReq({ ...req, style: e.target.value })} />
                  <select className="input" value={req.size} onChange={(e) => setReq({ ...req, size: e.target.value })}>
                    <option value="45">{t("custom.s1")}</option>
                    <option value="75">{t("custom.s2")}</option>
                    <option value="120">{t("custom.s3")}</option>
                  </select>
                  <button className="btn-primary w-full" disabled={!req.topic.trim()}>{t("custom.submit", { p: Math.round(Number(req.size) / 2) })}</button>
                  <p className="text-[11px] text-muted">{t("custom.rules")}</p>
                </form>
                {myRequests.length > 0 && (
                  <div className="card divide-y divide-line">
                    {myRequests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{r.topic}</p>
                          <p className="text-xs text-muted">{r.price} € · {t("custom.deposit", { p: r.deposit })} · {new Date(r.createdAt).toLocaleDateString(lang)}</p>
                        </div>
                        <span className={`chip shrink-0 ${r.status === "delivered" ? "border-ok/40 text-ok" : r.status === "declined" ? "text-rose" : "text-gold"}`}>{t(`custom.${r.status}`)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside id="tiers" className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            {p.tiers.map((tier) => (
              <div key={tier.id} className={`card p-5 ${current === tier.id ? "border-gold" : ""}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">{tier.name}</h3>
                  <p><b className="text-xl text-gold">{tier.price} €</b><span className="text-xs text-muted">{t("perMonth")}</span></p>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {tier.perks.map((x) => <li key={x}>· {x}</li>)}
                  {tier.id === "vip" && <li>· {t("profile.voice")}</li>}
                </ul>
                {current === tier.id ? <p className="mt-4 text-center text-sm text-ok">{t("profile.active")}</p> : (
                  <button className="btn-ghost mt-4 w-full" onClick={() => subscribe(tier.id, tier.price, tier.name)}>{current ? t("profile.switch") : t("profile.subscribe")}</button>
                )}
              </div>
            ))}
            <TipGoal personaId={p.id} />
            <p className="px-1 text-xs text-muted">{t("profile.note", { studio: p.creatorStudio })}</p>
            <Link href={`/gift?persona=${p.handle}`} className="btn-ghost w-full">🎁 {t("gift.giveSub")}</Link>
            <ReportButton target="persona" targetId={p.id} personaId={p.id} excerpt={p.name} label={`⚑ ${t("profile.report")}`} className="px-1" />
          </aside>
        </div>
      </div>
      <SimilarPersonas id={p.id} />
      {storyOpen && <StoryViewer personaId={p.id} onClose={() => setStoryOpen(false)} />}
    </div>
  );
}
