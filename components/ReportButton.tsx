"use client";

import { useState } from "react";
import { type Report, useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

const reasons = ["report.minor", "report.realPerson", "report.violence", "report.spam", "report.other"] as const;

/** Nahlášení příspěvku, zprávy, profilu nebo živé události. Bez databáze se ukládá lokálně, s ní na server. */
export default function ReportButton({ target, targetId, personaId, excerpt, className = "", label }: {
  target: Report["target"]; targetId: string; personaId?: string; excerpt?: string; className?: string; label?: string;
}) {
  const { set, dbEnabled } = useStore();
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number]>("report.other");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  async function send() {
    const report: Report = {
      id: crypto.randomUUID(), target, targetId, personaId, excerpt: excerpt?.slice(0, 200),
      reason: reason.replace("report.", ""), note: note.slice(0, 500), source: "user", createdAt: Date.now(), status: "open",
    };
    set((s) => ({ reports: [report, ...s.reports] }));
    if (dbEnabled) {
      fetch("/api/moderation", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(report) }).catch(() => {});
    }
    setDone(true);
  }

  return (
    <>
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); setDone(false); }} className={`text-xs text-muted hover:text-rose ${className}`} aria-label={t("report.title")}>
        {label ?? "⚑"}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl">{t("report.title")}</h3>
            {done ? (
              <>
                <p className="mt-3 text-sm text-muted">{t("report.thanks")}</p>
                <button className="btn-ghost mt-5 w-full" onClick={() => setOpen(false)}>OK</button>
              </>
            ) : (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium">{t("report.reason")}</p>
                {reasons.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> {t(r)}
                  </label>
                ))}
                <textarea className="input min-h-16" placeholder={t("report.note")} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2">
                  <button className="btn-ghost flex-1" onClick={() => setOpen(false)}>{t("cancel")}</button>
                  <button className="btn-primary flex-1" onClick={send}>{t("report.send")}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
