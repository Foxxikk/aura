"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** Tlačítko „Nainstalovat aplikaci“ – zobrazí se jen tam, kde to prohlížeč umí (Chrome, Edge, Android). */
export default function InstallPrompt() {
  const t = useT();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  if (!evt) return null;
  return (
    <button className="chip text-gold" onClick={async () => { await evt.prompt(); setEvt(null); }}>
      ⬇ {t("install")}
    </button>
  );
}
