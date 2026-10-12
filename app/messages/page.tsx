"use client";

import Link from "next/link";
import { personas } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Visuals";

export default function Messages() {
  const { chats, subscriptions, unread, scheduled, ready } = useStore();
  if (!ready) return null;
  const mine = personas.filter((p) => subscriptions[p.id] || chats[p.id]?.length);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl">Zprávy</h1>
      {!mine.length && (
        <div className="card mt-8 p-8 text-center text-muted">
          Zatím nemáš žádné konverzace. <Link href="/explore" className="text-gold">Najdi personu</Link> a předplať si ji.
        </div>
      )}
      <div className="mt-6 space-y-2">
        {mine.map((p) => {
          const list = (chats[p.id] ?? []).filter((m) => m.from !== "system");
          const last = list[list.length - 1];
          const isTyping = scheduled.some((s) => s.personaId === p.id && Date.now() >= s.typingFrom);
          return (
            <Link key={p.id} href={`/messages/${p.handle}`} className="card flex items-center gap-4 p-4 hover:border-gold/40">
              <Avatar p={p} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  <span className="ai-badge">AI</span>
                </div>
                <p className="truncate text-sm text-muted">
                  {isTyping ? "píše…" : last ? (last.from === "fan" ? "Ty: " : "") + (last.ppv ? "📎 Placený obsah" : last.text) : "Napiš první zprávu"}
                </p>
              </div>
              {!!unread[p.id] && <span className="rounded-full bg-rose px-2 py-0.5 text-xs font-bold">{unread[p.id]}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
