"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { personaByHandle, posts } from "@/lib/data";
import { ChatMessage, Scheduled, useStore } from "@/lib/store";
import { Avatar } from "@/components/Visuals";
import { PresenceDot } from "@/components/PersonaCard";
import { MediaTile } from "@/components/Visuals";
import { localTime, replyTiming } from "@/lib/realism";

export default function Chat({ handle }: { handle: string }) {
  const p = personaByHandle(handle)!;
  const store = useStore();
  const { chats, subscriptions, scheduled, memory, unlocked, fastMode, set, spend, ready } = store;
  const msgs = chats[p.id] ?? [];
  const sub = subscriptions[p.id];
  const [text, setText] = useState("");
  const [now, setNow] = useState(Date.now());
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  // otevřením chatu se nepřečtené vynulují; první zpráva je uvítání a informace o AI
  useEffect(() => {
    if (!ready) return;
    set((s) => {
      const next: Partial<typeof s> = { unread: { ...s.unread, [p.id]: 0 } };
      if (!s.chats[p.id]?.length) {
        next.chats = {
          ...s.chats,
          [p.id]: [
            { id: "sys", from: "system", text: `${p.name} je AI persona. Odpovědi generuje umělá inteligence v jejím charakteru.`, at: Date.now() },
          ],
        };
      }
      return next;
    });
  }, [ready, p.id, p.name, set, msgs.length]);

  const pending = scheduled.filter((s) => s.personaId === p.id);
  const typing = pending.some((s) => now >= s.typingFrom && now < s.deliverAt);

  async function send(extra?: { tip?: number }) {
    const body = text.trim();
    if (!body && !extra?.tip) return;
    const fanMsg: ChatMessage = {
      id: crypto.randomUUID(),
      from: "fan",
      text: extra?.tip ? `Poslal(a) jsem tip ${extra.tip} € 💛${body ? " – " + body : ""}` : body,
      at: Date.now(),
      status: "sent",
      tip: extra?.tip,
    };
    setText("");
    const history = [...msgs, fanMsg];
    set((s) => ({ chats: { ...s.chats, [p.id]: history } }));
    setTimeout(
      () =>
        set((s) => ({
          chats: { ...s.chats, [p.id]: (s.chats[p.id] ?? []).map((m) => (m.id === fanMsg.id && m.status === "sent" ? { ...m, status: "delivered" as const } : m)) },
        })),
      700
    );

    const ppvAvailable = posts
      .filter((x) => x.personaId === p.id && x.access === "ppv" && !unlocked.includes(x.id))
      .map((x) => ({ id: x.id, title: x.caption, price: x.price! }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ personaId: p.id, history: history.map(({ from, text }) => ({ from, text })), memory: memory[p.id], ppvAvailable }),
    }).then((r) => r.json());

    const replies: string[] = res.replies ?? ["…"];
    const items: Scheduled[] = [];
    // pokud už persona něco píše, nové odpovědi se řadí za ni
    let cursor = Math.max(Date.now(), ...pending.map((x) => x.deliverAt));
    const first = replyTiming(p, fanMsg.text, replies.join(" "), { vip: sub === "vip", fast: fastMode });
    const readAt = cursor + first.readDelay;
    cursor = readAt + 400;
    replies.forEach((r, i) => {
      const t = replyTiming(p, fanMsg.text, r, { vip: sub === "vip", fast: fastMode });
      const typingFrom = cursor + (i === 0 ? 0 : 600 + Math.random() * 1500);
      const deliverAt = typingFrom + t.typing;
      items.push({ id: crypto.randomUUID(), personaId: p.id, readAt, typingFrom, deliverAt, msg: { id: crypto.randomUUID(), from: "persona", text: r, at: deliverAt } });
      cursor = deliverAt;
    });
    if (res.offerPostId) {
      const post = posts.find((x) => x.id === res.offerPostId);
      if (post) {
        const typingFrom = cursor + 800;
        const deliverAt = typingFrom + 1800;
        items.push({
          id: crypto.randomUUID(), personaId: p.id, readAt, typingFrom, deliverAt,
          msg: { id: crypto.randomUUID(), from: "persona", text: "", at: deliverAt, ppv: { postId: post.id, title: post.caption, price: post.price! } },
        });
      }
    }
    set((s) => ({
      scheduled: [...s.scheduled, ...items],
      memory: res.memo ? { ...s.memory, [p.id]: [s.memory[p.id], res.memo].filter(Boolean).join("; ") } : s.memory,
    }));
  }

  function unlockPpv(m: ChatMessage) {
    if (!m.ppv) return;
    const price = sub === "vip" ? Math.round(m.ppv.price * 0.8 * 100) / 100 : m.ppv.price;
    if (!spend(price, `PPV ve zprávě: ${m.ppv.title} (${p.name})`)) return alert("Nedostatek kreditu – dobij si peněženku.");
    set((s) => ({ unlocked: [...s.unlocked, m.ppv!.postId] }));
  }

  function tip(amount: number) {
    if (!spend(amount, `Tip – ${p.name}`)) return alert("Nedostatek kreditu – dobij si peněženku.");
    send({ tip: amount });
  }

  if (!ready) return null;

  if (!sub) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <Avatar p={p} size={80} />
        <h1 className="mt-4 font-display text-3xl">Chat s {p.name.split(" ")[0]}</h1>
        <p className="mt-2 text-sm text-muted">Chat je dostupný předplatitelům.</p>
        <Link href={`/c/${p.handle}#tiers`} className="btn-primary mt-6">Vybrat předplatné</Link>
      </div>
    );
  }

  return (
    <div className="card mx-auto flex h-[calc(100vh-11rem)] max-w-3xl flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Link href="/messages" className="text-muted md:hidden">←</Link>
        <Avatar p={p} size={44} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/c/${p.handle}`} className="font-semibold">{p.name}</Link>
            <span className="ai-badge">AI persona</span>
          </div>
          <div className="flex items-center gap-3">
            <PresenceDot p={p} />
            <span className="text-xs text-muted">· u ní je {localTime(p.timezone)}</span>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted" title="Pro demo zkrátí čekání na odpověď">
          <input type="checkbox" checked={fastMode} onChange={(e) => set(() => ({ fastMode: e.target.checked }))} />
          Demo zrychlení
        </label>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {msgs.map((m, i) => {
          if (m.from === "system")
            return <p key={m.id} className="mx-auto max-w-sm rounded-xl bg-surface-2 px-3 py-2 text-center text-xs text-muted">{m.text}</p>;
          const mine = m.from === "fan";
          const lastMine = mine && !msgs.slice(i + 1).some((x) => x.from === "fan");
          if (m.ppv) {
            const open = unlocked.includes(m.ppv.postId);
            const post = posts.find((x) => x.id === m.ppv!.postId);
            return (
              <div key={m.id} className="w-60 overflow-hidden rounded-2xl rounded-bl-md border border-line bg-surface-2">
                <div className="relative aspect-square">
                  <MediaTile hue={post?.hue ?? 0} locked={!open} className="absolute inset-0" />
                  {!open && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button className="btn-primary" onClick={() => unlockPpv(m)}>🔒 {sub === "vip" ? Math.round(m.ppv.price * 0.8 * 100) / 100 : m.ppv.price} €</button>
                    </div>
                  )}
                </div>
                <p className="px-3 py-2 text-xs text-muted">{m.ppv.title}</p>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${mine ? "rounded-br-md bg-gradient-to-br from-gold to-rose text-[#1a0f12]" : "rounded-bl-md bg-surface-2"}`}>
                {m.text}
              </div>
              {lastMine && (
                <span className="mt-1 text-[10px] text-muted">
                  {m.status === "read" ? "Přečteno" : m.status === "delivered" ? "Doručeno" : "Odesláno"}
                </span>
              )}
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
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-3">
        <div className="mb-2 flex gap-2">
          {[3, 5, 10].map((a) => (
            <button key={a} className="chip hover:border-gold hover:text-gold" onClick={() => tip(a)}>Tip {a} €</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input className="input" placeholder={`Napiš ${p.name.split(" ")[0]}…`} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-primary" disabled={!text.trim()}>Odeslat</button>
        </form>
      </div>
    </div>
  );
}
