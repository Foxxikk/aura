"use client";

import type { Persona, Post } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { finalPrice, loyalty } from "@/lib/loyalty";
import { MediaTile } from "./Visuals";
import ReportButton from "./ReportButton";

export default function PostCard({ post, persona, reason }: { post: Post; persona: Persona; reason?: string }) {
  const store = useStore();
  const { subscriptions, unlocked, spend, set, likes, hiddenPosts, saved } = store;
  const isSaved = saved.includes(post.id);
  const t = useT();
  const subscribed = !!subscriptions[persona.id];
  const isVip = subscriptions[persona.id] === "vip";
  const open = post.access === "free" || (post.access === "subscribers" && subscribed) || unlocked.includes(post.id);
  const price = post.price ? finalPrice(post.price, { vip: isVip, loyaltyDiscount: loyalty(store).level.discount }) : 0;
  const liked = likes.includes(post.id);
  if (hiddenPosts.includes(post.id)) return null;

  function unlock() {
    if (!spend(price, `PPV: ${post.caption} (${persona.name})`, { personaId: persona.id, kind: "ppv", ref: post.id })) return alert(t("credit.low"));
    set((s) => ({ unlocked: [...s.unlocked, post.id] }));
  }

  return (
    <article className="card overflow-hidden">
      <div className="relative aspect-[4/5]">
        <MediaTile hue={post.hue} locked={!open} className="absolute inset-0" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {post.kind !== "photo" && (
            <span className="chip border-white/20 bg-black/40 text-white">{post.kind === "set" ? t("post.set", { n: post.count ?? 0 }) : t("post.video")}</span>
          )}
          <span className="chip border-white/20 bg-black/40 text-white">AI</span>
        </div>
        <div className="absolute right-3 top-3">
          <ReportButton target="post" targetId={post.id} personaId={persona.id} excerpt={post.caption} className="rounded-full bg-black/40 px-2 py-1 text-white" />
        </div>
        {!open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 p-4 text-center">
            <span className="text-3xl">🔒</span>
            {post.access === "ppv" ? (
              <button className="btn-primary" onClick={unlock}>{t("post.unlock", { p: price })}</button>
            ) : (
              <p className="text-sm text-white/90">{t("post.subsOnly")}</p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{post.caption}</p>
          <p className="text-xs text-muted">{t("post.daysAgo", { n: post.daysAgo })}{reason ? ` · ${reason}` : ""}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={() => set((s) => ({ saved: isSaved ? s.saved.filter((x) => x !== post.id) : [...s.saved, post.id] }))}
          className={`shrink-0 text-sm ${isSaved ? "text-gold" : "text-muted"}`}
          aria-label={t("nav.saved")}
          title={t("nav.saved")}
        >
          {isSaved ? "★" : "☆"}
        </button>
        <button
          onClick={() => set((s) => ({ likes: liked ? s.likes.filter((l) => l !== post.id) : [...s.likes, post.id] }))}
          className={`shrink-0 text-sm ${liked ? "text-rose" : "text-muted"}`}
        >
          {liked ? "♥" : "♡"} {post.likes + (liked ? 1 : 0)}
        </button>
        </div>
      </div>
    </article>
  );
}
