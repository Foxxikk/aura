"use client";

import Link from "next/link";
import { interactiveStories, seasons } from "@/lib/narrative";
import SeasonView from "@/components/SeasonView";
import { personaById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { Avatar, Cover } from "@/components/Visuals";

export default function Stories() {
  const { lang, storyProgress, suspendedPersonas, ready } = useStore();
  const t = useT();
  if (!ready) return null;
  const list = interactiveStories.filter((s) => !suspendedPersonas.includes(s.personaId));
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-5xl">{t("stories.title")}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t("stories.lead")}</p>
      </div>

      <section>
        <h2 className="mb-4 font-display text-3xl">{t("stories.interactive")}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((s) => {
            const p = personaById(s.personaId)!;
            const started = (storyProgress[s.id] ?? []).length > 0;
            return (
              <Link key={s.id} href={`/stories/${s.id}`} className="card overflow-hidden hover:border-gold/40">
                <Cover p={p} className="h-36" />
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <Avatar p={p} size={28} />
                    <span className="text-sm text-muted">{p.name}</span>
                    <span className="ai-badge">AI</span>
                  </div>
                  <h3 className="mt-3 font-display text-2xl">{s.title[lang]}</h3>
                  <p className="mt-1 text-sm text-muted">{s.blurb[lang]}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted">{t("stories.chapters", { n: s.chapters.length })} · {t("stories.free")}: 1</span>
                    <span className="btn-primary">{started ? t("stories.continue") : t("stories.read")}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-3xl">{t("seasons.title")}</h2>
        <div className="space-y-6">
          {seasons.filter((s) => !suspendedPersonas.includes(s.personaId)).map((s) => <SeasonView key={s.id} season={s} />)}
        </div>
      </section>
    </div>
  );
}
