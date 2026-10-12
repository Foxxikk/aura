"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Persona, personas, stories, Story } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Avatar, MediaTile } from "./Visuals";

const DURATION = 5000;

export function personaStories(personaId: string) {
  return stories.filter((s) => s.personaId === personaId && s.hoursAgo < 24);
}

/** Avatar s barevným kroužkem, když má persona neviděné stories. */
export function StoryAvatar({ p, size = 64, onOpen }: { p: Persona; size?: number; onOpen: () => void }) {
  const { storiesSeen } = useStore();
  const list = personaStories(p.id);
  const unseen = list.some((s) => !storiesSeen.includes(s.id));
  if (!list.length) return <Avatar p={p} size={size} />;
  return (
    <button onClick={onOpen} className="rounded-full p-[3px]" style={{ background: unseen ? "conic-gradient(from 200deg, var(--color-gold), var(--color-rose), var(--color-gold))" : "var(--color-line)" }} aria-label={`Stories – ${p.name}`}>
      <div className="rounded-full bg-bg p-[2px]"><Avatar p={p} size={size} /></div>
    </button>
  );
}

export function StoriesRow() {
  const [open, setOpen] = useState<string | null>(null);
  const withStories = personas.filter((p) => personaStories(p.id).length);
  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {withStories.map((p) => (
          <div key={p.id} className="flex w-20 shrink-0 flex-col items-center gap-1.5">
            <StoryAvatar p={p} size={60} onOpen={() => setOpen(p.id)} />
            <span className="w-full truncate text-center text-xs text-muted">{p.name.split(" ")[0]}</span>
          </div>
        ))}
      </div>
      {open && <StoryViewer personaId={open} onClose={() => setOpen(null)} onNextPersona={() => {
        const i = withStories.findIndex((p) => p.id === open);
        const next = withStories[i + 1];
        setOpen(next ? next.id : null);
      }} />}
    </>
  );
}

export function StoryViewer({ personaId, onClose, onNextPersona }: { personaId: string; onClose: () => void; onNextPersona?: () => void }) {
  const { subscriptions, set } = useStore();
  const router = useRouter();
  const list = personaStories(personaId);
  const p = personas.find((x) => x.id === personaId)!;
  const [i, setI] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [reply, setReply] = useState("");
  const [paused, setPaused] = useState(false);
  const story: Story | undefined = list[i];
  const locked = story?.subscribersOnly && !subscriptions[personaId];

  useEffect(() => {
    if (!story) return;
    set((s) => (s.storiesSeen.includes(story.id) ? {} : { storiesSeen: [...s.storiesSeen, story.id] }));
  }, [story, set]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(t);
  }, [paused, i]);

  useEffect(() => {
    if (elapsed >= DURATION) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  function next() {
    setElapsed(0);
    if (i < list.length - 1) setI(i + 1);
    else if (onNextPersona) { setI(0); onNextPersona(); }
    else onClose();
  }
  function prev() {
    setElapsed(0);
    if (i > 0) setI(i - 1);
  }
  function sendReply() {
    if (!reply.trim()) return;
    router.push(`/messages/${p.handle}#reply=${encodeURIComponent(`(reakce na story „${story!.caption}“) ${reply.trim()}`)}`);
    onClose();
  }

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-0 sm:p-6" onClick={onClose}>
      <div className="relative h-full w-full max-w-sm overflow-hidden sm:h-[85vh] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <MediaTile hue={story.hue} locked={locked} className="absolute inset-0" />
        <div className="absolute inset-x-0 top-0 z-10 space-y-3 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex gap-1">
            {list.map((s, j) => (
              <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
                <div className="h-full bg-white" style={{ width: j < i ? "100%" : j === i ? `${Math.min(100, (elapsed / DURATION) * 100)}%` : "0%" }} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Avatar p={p} size={32} />
            <span className="text-sm font-semibold text-white">{p.name}</span>
            <span className="ai-badge">AI</span>
            <span className="text-xs text-white/70">před {story.hoursAgo} h</span>
            <button onClick={onClose} className="ml-auto text-xl text-white" aria-label="Zavřít">×</button>
          </div>
        </div>
        <button className="absolute inset-y-0 left-0 z-0 w-1/3" onClick={prev} aria-label="Předchozí" />
        <button className="absolute inset-y-0 right-0 z-0 w-2/3" onClick={next} onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)} aria-label="Další" />
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
            <span className="text-3xl">🔒</span>
            <p className="text-sm text-white">🔒</p>
            <button className="btn-primary" onClick={() => { onClose(); router.push(`/c/${p.handle}#tiers`); }}>Předplatit</button>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="font-display text-2xl text-white">{story.caption}</p>
          {subscriptions[personaId] && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); sendReply(); }}>
              <input className="input bg-black/40" placeholder="…" value={reply}
                onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} onChange={(e) => setReply(e.target.value)} />
              <button className="btn-primary" disabled={!reply.trim()}>➤</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
