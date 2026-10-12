"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { personas, posts, type Post, type Persona } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import PostCard from "@/components/PostCard";
import { StoriesRow } from "@/components/Stories";
import { Avatar } from "@/components/Visuals";

type Scored = { post: Post; persona: Persona; score: number; why: string };

/**
 * Doporučení „Pro tebe“: skóre = afinita k personě (předplatné, chat, lajky, nákupy)
 * + shoda kategorií s tím, co fanoušek lajkuje + čerstvost + objevování nových person.
 */
export default function Feed() {
  const store = useStore();
  const { subscriptions, chats, likes, transactions, unlocked, suspendedPersonas, hiddenPosts, ready, lang } = store;
  const t = useT();
  const [tab, setTab] = useState<"forYou" | "following">("forYou");

  const scored = useMemo<Scored[]>(() => {
    const likedCats = new Map<string, number>();
    for (const id of likes) {
      const p = personas.find((x) => x.id === posts.find((y) => y.id === id)?.personaId);
      p?.categories.forEach((c) => likedCats.set(c, (likedCats.get(c) ?? 0) + 1));
    }
    const affinity = (p: Persona) => {
      const sub = subscriptions[p.id] ? 6 : 0;
      const chat = Math.min(6, (chats[p.id] ?? []).filter((m) => m.from === "fan").length * 0.5);
      const liked = posts.filter((x) => x.personaId === p.id && likes.includes(x.id)).length * 1.5;
      const bought = transactions.filter((x) => x.personaId === p.id && x.amount < 0).length;
      return { sub, chat, liked, bought, total: sub + chat + liked + bought };
    };
    return posts
      .filter((x) => !hiddenPosts.includes(x.id) && !suspendedPersonas.includes(x.personaId))
      .map((post) => {
        const persona = personas.find((p) => p.id === post.personaId)!;
        const a = affinity(persona);
        const catMatch = persona.categories.reduce((s, c) => s + (likedCats.get(c) ?? 0), 0);
        const fresh = 6 / (1 + post.daysAgo);
        const discovery = !subscriptions[persona.id] && post.access === "free" ? 2 + (persona.isNew ? 2 : 0) : 0;
        const seen = unlocked.includes(post.id) ? -1 : 0;
        const score = a.total + catMatch * 1.2 + fresh + discovery + seen + (post.likes / 1000);
        const topCat = persona.categories.find((c) => likedCats.get(c));
        const why = a.sub ? t("feed.why.sub") : a.chat >= 2 ? t("feed.why.chat") : topCat ? t("feed.why.cat", { c: topCat }) : persona.isNew ? t("feed.why.new") : catMatch ? t("feed.why.likes") : "";
        return { post, persona, score, why };
      })
      .sort((x, y) => y.score - x.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, chats, likes, transactions, unlocked, suspendedPersonas, hiddenPosts, lang]);

  if (!ready) return null;
  const list = tab === "following" ? scored.filter((s) => subscriptions[s.persona.id]).sort((a, b) => a.post.daysAgo - b.post.daysAgo) : scored;
  const suggested = personas.filter((p) => !subscriptions[p.id] && !suspendedPersonas.includes(p.id)).slice(0, 3);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div>
        <h1 className="font-display text-5xl">{t("feed.title")}</h1>
        <div className="mt-5"><StoriesRow /></div>
        <div className="mt-4 flex gap-2 border-b border-line">
          {(["forYou", "following"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`-mb-px border-b-2 px-4 py-2 text-sm ${tab === k ? "border-gold" : "border-transparent text-muted"}`}>
              {k === "forYou" ? t("feed.forYou") : t("feed.following")}
            </button>
          ))}
        </div>
        {!list.length && <p className="card mt-6 p-8 text-center text-muted">{t("feed.empty")}</p>}
        <div className="mx-auto mt-6 max-w-xl space-y-6">
          {list.slice(0, 24).map(({ post, persona, why }) => (
            <div key={post.id}>
              <Link href={`/c/${persona.handle}`} className="mb-2 flex items-center gap-2">
                <Avatar p={persona} size={32} />
                <span className="text-sm font-semibold">{persona.name}</span>
                <span className="ai-badge">AI</span>
              </Link>
              <PostCard post={post} persona={persona} reason={tab === "forYou" ? why : undefined} />
            </div>
          ))}
        </div>
      </div>
      <aside className="hidden space-y-3 lg:block">
        <h2 className="text-sm font-semibold text-muted">{t("explore.title")}</h2>
        {suggested.map((p) => (
          <Link key={p.id} href={`/c/${p.handle}`} className="card flex items-center gap-3 p-3 hover:border-gold/40">
            <Avatar p={p} size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-muted">{t("card.from")} {p.tiers[0].price} €{t("card.month")}</p>
            </div>
          </Link>
        ))}
      </aside>
    </div>
  );
}
