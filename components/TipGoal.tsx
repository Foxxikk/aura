"use client";

import { tipGoals, personaById } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function TipGoal({ personaId, compact = false }: { personaId: string; compact?: boolean }) {
  const { tipsToGoal, spend, set } = useStore();
  const t = useT();
  const goal = tipGoals.find((g) => g.personaId === personaId);
  const p = personaById(personaId);
  if (!goal || !p) return null;
  const mine = tipsToGoal[personaId] ?? 0;
  const raised = Math.min(goal.target, goal.raisedBase + mine);
  const pct = Math.round((raised / goal.target) * 100);
  const done = raised >= goal.target;

  function tip(a: number) {
    void compact;
    if (!spend(a, `Příspěvek na cíl „${goal!.title}“ – ${p!.name}`, { personaId, kind: "tip" })) return alert(t("credit.low"));
    set((s) => ({ tipsToGoal: { ...s.tipsToGoal, [personaId]: (s.tipsToGoal[personaId] ?? 0) + a } }));
  }

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted">{t("tip.goal")}</p>
        <p className="text-xs text-muted">{raised} / {goal.target} €</p>
      </div>
      <p className="mt-1 font-semibold">{goal.title}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gradient-to-r from-gold to-rose transition-all" style={{ width: `${pct}%` }} />
      </div>
      
      {mine > 0 && <p className="mt-2 text-xs text-gold">{t("tip.you", { n: mine })}</p>}
      {done ? (
        <p className="mt-3 text-sm text-ok">{t("tip.done")}</p>
      ) : (
        <div className="mt-3 flex gap-2">
          {[5, 10, 25].map((a) => (
            <button key={a} className="chip flex-1 justify-center hover:border-gold hover:text-gold" onClick={() => tip(a)}>+{a} €</button>
          ))}
        </div>
      )}
    </div>
  );
}
