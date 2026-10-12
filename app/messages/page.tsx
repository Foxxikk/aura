"use client";

import Link from "next/link";
import { personas } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Visuals";
import { useT } from "@/lib/i18n";

export default function Messages() {
  const { chats, subscriptions, unread, scheduled, ready } = useStore();
  const t = useT();
  if (!ready) return null;
  const mine = personas.filter((p) => subscriptions[p.id] || chats[p.id]?.length);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl">{t("messages.title")}</h1>
      {!mine.length && (
        <div className="card mt-8 p-8 text-center text-muted">
          {t("messages.empty")} <Link href="/explore" className="text-gold">{t("messages.find")}</Link>
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
                  {isTyping ? t("chat.typing") : last ? (last.from === "fan" ? t("messages.you") : "") + (last.ppv ? "📎 Placený obsah" : last.bundle ? "📦 Balíček" : last.voice ? "🎙 Hlasová zpráva" : last.text) : t("messages.first")}
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
