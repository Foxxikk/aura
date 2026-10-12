"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { interactiveStories } from "@/lib/narrative";
import { personaById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { finalPrice, loyalty } from "@/lib/loyalty";
import { Avatar, Cover } from "@/components/Visuals";

/** Průchod je uložen jako seznam „kapitola:uzel“. Volby fanouška se ukládají a příběh jde kdykoli dočíst. */
export default function Reader({ id }: { id: string }) {
  const story = interactiveStories.find((s) => s.id === id)!;
  const p = personaById(story.personaId)!;
  const store = useStore();
  const { lang, storyProgress, storyUnlocked, set, spend, ready } = store;
  const t = useT();
  const endRef = useRef<HTMLDivElement>(null);
  const first = `${story.chapters[0].id}:${story.chapters[0].start}`;
  const path = storyProgress[id]?.length ? storyProgress[id] : [first];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [path.length]);

  if (!ready) return null;

  const resolve = (key: string) => {
    const [chId, nodeId] = key.split(":");
    const ch = story.chapters.find((c) => c.id === chId)!;
    return { ch, node: ch.nodes.find((n) => n.id === nodeId)! };
  };
  const last = resolve(path[path.length - 1]);
  const chIdx = story.chapters.findIndex((c) => c.id === last.ch.id);
  const nextCh = story.chapters[chIdx + 1];
  const loyaltyOff = loyalty(store).level.discount;

  function go(next: string) {
    set((s) => ({ storyProgress: { ...s.storyProgress, [id]: [...path, next] } }));
  }
  function openNext() {
    if (!nextCh) return;
    const owned = nextCh.price === 0 || storyUnlocked.includes(nextCh.id);
    if (!owned) {
      const price = finalPrice(nextCh.price, { loyaltyDiscount: loyaltyOff });
      if (!spend(price, `Příběh: ${story.title.cs} – ${nextCh.title.cs}`, { personaId: p.id, kind: "ppv", ref: nextCh.id })) return alert(t("credit.low"));
      set((s) => ({ storyUnlocked: [...s.storyUnlocked, nextCh.id] }));
    }
    go(`${nextCh.id}:${nextCh.start}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/stories" className="text-sm text-muted">← {t("stories.back")}</Link>
      <Cover p={p} className="mt-3 h-40 rounded-3xl" />
      <div className="mt-4 flex items-center gap-2">
        <Avatar p={p} size={32} />
        <span className="text-sm text-muted">{p.name}</span>
        <span className="ai-badge">AI</span>
      </div>
      <h1 className="mt-2 font-display text-4xl">{story.title[lang]}</h1>

      <div className="mt-6 space-y-4">
        {path.map((key, i) => {
          const { ch, node } = resolve(key);
          const newChapter = i === 0 || resolve(path[i - 1]).ch.id !== ch.id;
          const isLast = i === path.length - 1;
          return (
            <div key={key + i}>
              {newChapter && <p className="mb-3 mt-6 text-xs uppercase tracking-wider text-gold">{ch.title[lang]}</p>}
              <p className="font-display text-xl leading-relaxed text-ink/90">{node.text[lang]}</p>
              {isLast && node.choices.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted">{t("stories.choose")}</p>
                  {node.choices.map((c) => (
                    <button key={c.next} onClick={() => go(`${ch.id}:${c.next}`)} className="block w-full rounded-xl border border-line px-4 py-3 text-left text-sm hover:border-gold">
                      {c.label[lang]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {last.node.end && (
        <div className="card mt-8 p-6 text-center">
          {last.node.end === "chapter" && nextCh ? (
            <>
              <p className="font-display text-2xl">{nextCh.title[lang]}</p>
              <button className="btn-primary mt-4" onClick={openNext}>
                {nextCh.price === 0 || storyUnlocked.includes(nextCh.id) ? t("stories.nextChapter") : t("stories.unlock", { p: finalPrice(nextCh.price, { loyaltyDiscount: loyaltyOff }) })}
              </button>
            </>
          ) : (
            <p className="font-display text-2xl">{t("stories.endStory")}</p>
          )}
          <button className="mt-4 block w-full text-xs text-muted underline" onClick={() => set((s) => ({ storyProgress: { ...s.storyProgress, [id]: [first] } }))}>{t("stories.restart")}</button>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
