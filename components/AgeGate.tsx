"use client";

import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function AgeGate() {
  const { ready, ageVerified, set } = useStore();
  const t = useT();
  const path = usePathname();
  if (!ready || ageVerified || path === "/pin") return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="card max-w-md p-8 text-center">
        <p className="font-display text-5xl italic">aura<span className="text-gold">.</span></p>
        <h2 className="mt-4 text-lg font-semibold">{t("age.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("age.body")}</p>
        <p className="mt-2 text-xs text-muted">{t("age.note")}</p>
        <div className="mt-6 flex flex-col gap-2">
          <button className="btn-primary" onClick={() => set(() => ({ ageVerified: true }))}>{t("age.enter")}</button>
          <a className="btn-ghost" href="https://www.google.com">{t("age.leave")}</a>
        </div>
      </div>
    </div>
  );
}
