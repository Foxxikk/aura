"use client";

import { currentEvent } from "@/lib/data";
import { useT } from "@/lib/i18n";

export default function EventBanner() {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gradient-to-r from-[#3a1d14] to-[#2a1222] px-4 py-3 text-sm">
      <span className="ai-badge">{t("event.badge")}</span>
      <b>{t("event.title")}</b>
      <span className="text-muted">{t("event.desc")}</span>
      <span className="ml-auto text-xs text-gold">{t("event.ends", { n: currentEvent.endsInHours })}</span>
    </div>
  );
}
