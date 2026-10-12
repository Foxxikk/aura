"use client";

import type { Persona, Post } from "@/lib/data";
import { useStore } from "@/lib/store";
import { MediaTile } from "./Visuals";

export default function PostCard({ post, persona }: { post: Post; persona: Persona }) {
  const { subscriptions, unlocked, spend, set, likes } = useStore();
  const subscribed = !!subscriptions[persona.id];
  const isVip = subscriptions[persona.id] === "vip";
  const open =
    post.access === "free" || (post.access === "subscribers" && subscribed) || unlocked.includes(post.id);
  const price = post.price ? (isVip ? Math.round(post.price * 0.8 * 100) / 100 : post.price) : 0;
  const liked = likes.includes(post.id);

  function unlock() {
    if (!spend(price, `PPV: ${post.caption} (${persona.name})`)) {
      alert("Nedostatek kreditu – dobij si peněženku.");
      return;
    }
    set((s) => ({ unlocked: [...s.unlocked, post.id] }));
  }

  return (
    <article className="card overflow-hidden">
      <div className="relative aspect-[4/5]">
        <MediaTile hue={post.hue} locked={!open} className="absolute inset-0" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {post.kind !== "photo" && (
            <span className="chip border-white/20 bg-black/40 text-white">
              {post.kind === "set" ? `Set · ${post.count} fotek` : "Video"}
            </span>
          )}
          <span className="chip border-white/20 bg-black/40 text-white">AI</span>
        </div>
        {!open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 p-4 text-center">
            <span className="text-3xl">🔒</span>
            {post.access === "ppv" ? (
              <button className="btn-primary" onClick={unlock}>
                Odemknout za {price} €
              </button>
            ) : (
              <p className="text-sm text-white/90">Jen pro předplatitele</p>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm font-medium">{post.caption}</p>
          <p className="text-xs text-muted">před {post.daysAgo} d</p>
        </div>
        <button
          onClick={() => set((s) => ({ likes: liked ? s.likes.filter((l) => l !== post.id) : [...s.likes, post.id] }))}
          className={`text-sm ${liked ? "text-rose" : "text-muted"}`}
        >
          {liked ? "♥" : "♡"} {post.likes + (liked ? 1 : 0)}
        </button>
      </div>
    </article>
  );
}
