"use client";

import { tipGoals, personaById } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function TipGoal({ personaId, compact = false }: { personaId: string; compact?: boolean }) {
  const { tipsToGoal, spend, set } = useStore();
  const goal = tipGoals.find((g) => g.personaId === personaId);
  const p = personaById(personaId);
  if (!goal || !p) return null;
  const mine = tipsToGoal[personaId] ?? 0;
  const raised = Math.min(goal.target, goal.raisedBase + mine);
  const pct = Math.round((raised / goal.target) * 100);
  const done = raised >= goal.target;

  function tip(a: number) {
    if (!spend(a, `Příspěvek na cíl „${goal!.title}“ – ${p!.name}`, { personaId, kind: "tip" })) return alert("Nedostatek kreditu – dobij si peněženku.");
    set((s) => ({ tipsToGoal: { ...s.tipsToGoal, [personaId]: (s.tipsToGoal[personaId] ?? 0) + a } }));
  }

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-wider text-muted">Cíl tipů</p>
        <p className="text-xs text-muted">{raised} / {goal.target} €</p>
      </div>
      <p className="mt-1 font-semibold">{goal.title}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-gradient-to-r from-gold to-rose transition-all" style={{ width: `${pct}%` }} />
      </div>
      {!compact && <p className="mt-2 text-xs text-muted">{goal.reward}</p>}
      {mine > 0 && <p className="mt-2 text-xs text-gold">Přispěl(a) jsi {mine} €</p>}
      {done ? (
        <p className="mt-3 text-sm text-ok">Cíl splněn! Odměna přijde do zpráv.</p>
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
