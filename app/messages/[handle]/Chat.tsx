"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bundlePrice, currentEvent, personaByHandle, posts } from "@/lib/data";
import { availableOffers, ChatMessage, scheduleReplies, useStore } from "@/lib/store";
import { Avatar, MediaTile } from "@/components/Visuals";
import { PresenceDot } from "@/components/PersonaCard";
import VoiceBubble from "@/components/VoiceBubble";
import TipGoal from "@/components/TipGoal";
import { localTime, replyTiming } from "@/lib/realism";
import { useT } from "@/lib/i18n";
import { finalPrice, loyalty } from "@/lib/loyalty";
import { checkText, modLabels } from "@/lib/moderation";
import ReportButton from "@/components/ReportButton";

export default function Chat({ handle }: { handle: string }) {
  const p = personaByHandle(handle)!;
  const store = useStore();
  const { chats, subscriptions, scheduled, memory, unlocked, bundles, fastMode, set, spend, ready, lang } = store;
  const t = useT();
  const loyaltyOff = loyalty(store).level.discount;
  const msgs = chats[p.id] ?? [];
  const sub = subscriptions[p.id];
  const isVip = sub === "vip";
  const mem = memory[p.id] ?? { facts: [] };
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const [showMem, setShowMem] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [msgs.length, scheduled.length]);

  // odpověď na story přichází v #reply=…
  useEffect(() => {
    const m = window.location.hash.match(/^#reply=(.+)$/);
    if (m) {
      setText(decodeURIComponent(m[1]));
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    set((s) => {
      const next: Partial<typeof s> = { unread: { ...s.unread, [p.id]: 0 } };
      if (!s.chats[p.id]?.length) {
        next.chats = {
          ...s.chats,
          [p.id]: [{ id: "sys", from: "system", text: t("chat.aiNote", { name: p.name }), at: Date.now() }],
        };
      }
      return next;
    });
  }, [ready, p.id, p.name, set, msgs.length]);

  const pending = scheduled.filter((s) => s.personaId === p.id);
  const typing = pending.some((s) => now >= s.typingFrom && now < s.deliverAt);
  const recording = typing && pending.some((s) => now >= s.typingFrom && now < s.deliverAt && s.msg.voice);

  async function ask(fanMsg: ChatMessage | null, mode: "reply" | "voice") {
    const history = fanMsg ? [...msgs, fanMsg] : msgs;
    const offers = availableOffers(store, p.id, posts);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        personaId: p.id,
        mode,
        lang,
        tier: sub,
        history: history.map(({ from, text }) => ({ from, text })),
        memory: store.consents.aiMemory ? mem : undefined,
        offers: { ppv: offers.ppv, bundles: offers.bundles.map((b) => ({ id: b.id, title: b.title, price: bundlePrice(b, currentEvent.bundleDiscount).price })) },
      }),
    }).then((r) => r.json());

    const replies: string[] = res.replies ?? ["…"];
    // VIP občas dostane krátkou odpověď jako hlasovku
    const asVoice = mode === "voice" || (isVip && replies.length === 1 && replies[0].length < 140 && Math.random() < 0.25);
    const extra: Partial<ChatMessage>[] = [];
    if (res.offer?.type === "ppv") {
      const post = posts.find((x) => x.id === res.offer.id);
      if (post) extra.push({ ppv: { postId: post.id, title: post.caption, price: post.price! } });
    }
    if (res.offer?.type === "bundle") {
      const b = bundles.find((x) => x.id === res.offer.id);
      if (b) extra.push({ bundle: { bundleId: b.id, title: b.title, price: bundlePrice(b, currentEvent.bundleDiscount).price } });
    }
    const first = replyTiming(p, fanMsg?.text ?? "", replies.join(" "), { vip: isVip, fast: fastMode });
    const after = Math.max(Date.now(), ...pending.map((x) => x.deliverAt));
    const items = scheduleReplies(p.id, replies.map((t) => ({ text: t, voice: asVoice })), {
      after,
      readDelay: first.readDelay,
      typingFor: (t) => replyTiming(p, "", t, { vip: isVip, fast: fastMode }).typing * (asVoice ? 1.4 : 1),
      extra,
    });
    set((s) => {
      const cur = s.memory[p.id] ?? { facts: [] };
      const memo = s.consents.aiMemory ? (res.memo as { name?: string; facts?: string[] } | undefined) : undefined;
      return {
        scheduled: [...s.scheduled, ...items],
        memory: memo
          ? { ...s.memory, [p.id]: { name: memo.name || cur.name, facts: Array.from(new Set([...cur.facts, ...(memo.facts ?? [])])).slice(-20) } }
          : s.memory,
      };
    });
  }

  async function send(extraOpts?: { tip?: number; voiceRequest?: boolean }) {
    const body = text.trim();
    if (!body && !extraOpts?.tip && !extraOpts?.voiceRequest) return;
    const fanMsg: ChatMessage = {
      id: crypto.randomUUID(),
      from: "fan",
      text: extraOpts?.voiceRequest ? t("chat.voiceAsk") : extraOpts?.tip ? `${t("chat.tipSent", { n: extraOpts.tip })}${body ? " – " + body : ""}` : body,
      at: Date.now(),
      status: "sent",
      tip: extraOpts?.tip,
    };
    const check = checkText(fanMsg.text);
    if (!check.ok) {
      set((s) => ({ reports: [{ id: crypto.randomUUID(), target: "message", targetId: fanMsg.id, personaId: p.id, reason: check.category, excerpt: fanMsg.text.slice(0, 200), source: "auto", createdAt: Date.now(), status: "open" }, ...s.reports] }));
      if (store.dbEnabled) fetch("/api/moderation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target: "message", targetId: fanMsg.id, personaId: p.id, reason: check.category, excerpt: fanMsg.text.slice(0, 200), source: "auto" }) }).catch(() => {});
      return alert(t("chat.blocked", { reason: modLabels[check.category][lang] }));
    }
    setText("");
    set((s) => ({ chats: { ...s.chats, [p.id]: [...(s.chats[p.id] ?? []), fanMsg] }, lastFanActivity: { ...s.lastFanActivity, [p.id]: Date.now() } }));
    setTimeout(
      () => set((s) => ({ chats: { ...s.chats, [p.id]: (s.chats[p.id] ?? []).map((m) => (m.id === fanMsg.id && m.status === "sent" ? { ...m, status: "delivered" as const } : m)) } })),
      700
    );
    await ask(fanMsg, extraOpts?.voiceRequest ? "voice" : "reply");
  }

  function unlockPpv(m: ChatMessage) {
    if (!m.ppv) return;
    const price = finalPrice(m.ppv.price, { vip: isVip, loyaltyDiscount: loyaltyOff });
    if (!spend(price, `PPV ve zprávě: ${m.ppv.title} (${p.name})`, { personaId: p.id, kind: "ppv", ref: m.broadcastId ?? m.ppv.postId })) return alert(t("credit.low"));
    set((s) => ({
      unlocked: [...s.unlocked, m.ppv!.postId],
      broadcasts: m.broadcastId ? s.broadcasts.map((b) => (b.id === m.broadcastId ? { ...b, purchases: b.purchases + 1 } : b)) : s.broadcasts,
    }));
  }

  function buyBundle(m: ChatMessage) {
    const b = bundles.find((x) => x.id === m.bundle?.bundleId);
    if (!b || !m.bundle) return;
    const bprice = finalPrice(m.bundle.price, { loyaltyDiscount: loyaltyOff });
    if (!spend(bprice, `Balíček: ${b.title} (${p.name})`, { personaId: p.id, kind: "bundle", ref: m.broadcastId ?? b.id })) return alert(t("credit.low"));
    set((s) => ({
      unlocked: Array.from(new Set([...s.unlocked, ...b.postIds])),
      broadcasts: m.broadcastId ? s.broadcasts.map((x) => (x.id === m.broadcastId ? { ...x, purchases: x.purchases + 1 } : x)) : s.broadcasts,
    }));
  }

  function tip(amount: number) {
    if (!spend(amount, `Tip – ${p.name}`, { personaId: p.id, kind: "tip" })) return alert(t("credit.low"));
    set((s) => ({ tipsToGoal: { ...s.tipsToGoal, [p.id]: (s.tipsToGoal[p.id] ?? 0) + amount } }));
    send({ tip: amount });
  }

  function forget(i: number | "name" | "all") {
    set((s) => {
      const cur = s.memory[p.id] ?? { facts: [] };
      const next = i === "all" ? { facts: [] } : i === "name" ? { ...cur, name: undefined } : { ...cur, facts: cur.facts.filter((_, j) => j !== i) };
      return { memory: { ...s.memory, [p.id]: next } };
    });
  }

  if (!ready) return null;

  if (!sub) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <Avatar p={p} size={80} />
        <h1 className="mt-4 font-display text-3xl">{t("chat.with", { name: p.name.split(" ")[0] })}</h1>
        <p className="mt-2 text-sm text-muted">{t("chat.subsOnly")}</p>
        <Link href={`/c/${p.handle}#tiers`} className="btn-primary mt-6">{t("chat.choose")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_280px]">
      <div className="card flex h-[calc(100vh-11rem)] flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Link href="/messages" className="text-muted md:hidden">←</Link>
          <Avatar p={p} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link href={`/c/${p.handle}`} className="truncate font-semibold">{p.name}</Link>
              <span className="ai-badge">AI persona</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3">
              {typing ? <span className="text-xs text-gold">{recording ? t("chat.recording") : t("chat.typing")}</span> : <PresenceDot p={p} />}
              <span className="text-xs text-muted">· {t("chat.localTime", { t: localTime(p.timezone) })}</span>
            </div>
          </div>
          <button className="chip lg:hidden" onClick={() => setShowMem(!showMem)}>{t("chat.memory")}</button>
        </div>

        {showMem && <div className="border-b border-line p-4 lg:hidden"><MemoryPanel mem={mem} name={p.name} forget={forget} /></div>}

        <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {msgs.map((m, i) => {
            if (m.from === "system")
              return <p key={m.id} className="mx-auto max-w-sm rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-muted">{m.text}</p>;
            const mine = m.from === "fan";
            const lastMine = mine && !msgs.slice(i + 1).some((x) => x.from === "fan");
            if (m.ppv) {
              const open = unlocked.includes(m.ppv.postId);
              const post = posts.find((x) => x.id === m.ppv!.postId);
              const price = finalPrice(m.ppv.price, { vip: isVip, loyaltyDiscount: loyaltyOff });
              return (
                <div key={m.id} className="space-y-1">
                  {m.text && <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2 text-sm">{m.text}</div>}
                  <div className="w-60 overflow-hidden rounded-2xl rounded-bl-md border border-line bg-surface-2">
                    <div className="relative aspect-square">
                      <MediaTile hue={post?.hue ?? 0} seed={post?.id} locked={!open} className="absolute inset-0" />
                      {!open && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <button className="btn-primary" onClick={() => unlockPpv(m)}>🔒 {price} €</button>
                        </div>
                      )}
                    </div>
                    <p className="px-3 py-2 text-xs text-muted">{m.ppv.title}</p>
                  </div>
                </div>
              );
            }
            if (m.bundle) {
              const b = bundles.find((x) => x.id === m.bundle!.bundleId);
              const owned = b ? b.postIds.every((id) => unlocked.includes(id)) : false;
              return (
                <div key={m.id} className="space-y-1">
                  {m.text && <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-surface-2 px-4 py-2 text-sm">{m.text}</div>}
                  <div className="w-64 rounded-2xl rounded-bl-md border border-gold/30 bg-surface-2 p-3">
                    <div className="grid grid-cols-3 gap-1">
                      {(b?.postIds ?? []).slice(0, 3).map((id) => {
                        const post = posts.find((x) => x.id === id);
                        return <MediaTile key={id} seed={id} hue={post?.hue ?? 0} locked={!unlocked.includes(id)} className="aspect-square rounded-md" />;
                      })}
                    </div>
                    <p className="mt-2 text-sm font-semibold">{m.bundle.title}</p>
                    <p className="text-xs text-muted">{b?.postIds.length} položek · −{b?.discount}% + akce −{currentEvent.bundleDiscount}%</p>
                    {owned ? <p className="mt-2 text-xs text-ok">{t("profile.unlocked")}</p> : <button className="btn-primary mt-2 w-full" onClick={() => buyBundle(m)}>{t("chat.buy", { p: finalPrice(m.bundle.price, { loyaltyDiscount: loyaltyOff }) })}</button>}
                  </div>
                </div>
              );
            }
            if (m.voice) return <div key={m.id}><VoiceBubble text={m.text} seconds={m.voice.seconds} pitch={1 + (p.hue % 30) / 100} /></div>;
            return (
              <div key={m.id} className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${mine ? "rounded-br-md bg-gradient-to-br from-gold to-rose text-[#1a0f12]" : "rounded-bl-md bg-surface-2"}`}>
                  {m.text}
                </div>
                {!mine && <ReportButton target="message" targetId={m.id} personaId={p.id} excerpt={m.text} className="mt-0.5 opacity-0 transition group-hover:opacity-100" label={`⚑ ${t("post.report")}`} />}
                {lastMine && <span className="mt-1 text-[10px] text-muted">{m.status === "read" ? t("chat.read") : m.status === "delivered" ? t("chat.delivered") : t("chat.sent")}</span>}
              </div>
            );
          })}
          {typing && (
            <div className="typing inline-flex gap-1 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3">
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
              <span className="h-1.5 w-1.5 rounded-full bg-muted" />
            </div>
          )}
        </div>

        <div className="border-t border-line p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {[3, 5, 10].map((a) => (
              <button key={a} className="chip hover:border-gold hover:text-gold" onClick={() => tip(a)}>{t("chat.tip", { n: a })}</button>
            ))}
            <button
              className={`chip ${isVip ? "hover:border-gold hover:text-gold" : "opacity-50"}`}
              title={isVip ? "" : "Hlasovky jsou pro VIP"}
              onClick={() => (isVip ? send({ voiceRequest: true }) : alert(t("chat.voiceVip")))}
            >
              🎙 {t("chat.voice")} {isVip ? "" : "· VIP"}
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <input className="input" placeholder={t("chat.placeholder")} value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn-primary" disabled={!text.trim()}>{t("chat.send")}</button>
          </form>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-muted" title="Pro demo zkrátí čekání na odpověď i proaktivní zprávy">
            <input type="checkbox" checked={fastMode} onChange={(e) => set(() => ({ fastMode: e.target.checked }))} />
            {t("chat.fast")}
          </label>
        </div>
      </div>

      <aside className="hidden space-y-4 lg:block">
        <div className="card p-4"><MemoryPanel mem={mem} name={p.name} forget={forget} /></div>
        <TipGoal personaId={p.id} compact />
      </aside>
    </div>
  );
}

function MemoryPanel({ mem, name, forget }: { mem: { name?: string; facts: string[] }; name: string; forget: (i: number | "name" | "all") => void }) {
  const t = useT();
  return (
    <div>
      <h3 className="text-sm font-semibold">{t("chat.memTitle", { name: name.split(" ")[0] })}</h3>
      <p className="mt-1 text-[11px] text-muted">{t("chat.memNote")}</p>
      {!mem.name && !mem.facts.length && <p className="mt-3 text-xs text-muted">{t("chat.memEmpty")}</p>}
      <ul className="mt-3 space-y-1.5 text-xs">
        {mem.name && (
          <li className="flex items-start justify-between gap-2 rounded-lg bg-surface-2 px-2 py-1.5">
            <span>{t("chat.memName")}: <b>{mem.name}</b></span>
            <button onClick={() => forget("name")} className="text-muted hover:text-rose" aria-label="Smazat">×</button>
          </li>
        )}
        {mem.facts.map((f, i) => (
          <li key={f + i} className="flex items-start justify-between gap-2 rounded-lg bg-surface-2 px-2 py-1.5">
            <span>{f}</span>
            <button onClick={() => forget(i)} className="text-muted hover:text-rose" aria-label="Smazat">×</button>
          </li>
        ))}
      </ul>
      {(mem.name || mem.facts.length > 0) && <button onClick={() => forget("all")} className="mt-3 text-[11px] text-muted underline">{t("chat.memClear")}</button>}
    </div>
  );
}
