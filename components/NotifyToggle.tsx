"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

function b64ToUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Zapnutí upozornění: lokální notifikace vždy, web push navíc, když je nastavený VAPID klíč a uživatel přihlášený. */
export default function NotifyToggle() {
  const { notificationsEnabled, set, user } = useStore();
  const t = useT();
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);
  if (typeof window !== "undefined" && typeof Notification === "undefined") return null;

  async function enable() {
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p !== "granted") return;
    set(() => ({ notificationsEnabled: true }));
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!key || !user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(key) });
      await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
    } catch {}
  }

  if (perm === "denied") return <p className="text-xs text-muted">{t("notify.denied")}</p>;
  if (notificationsEnabled && perm === "granted") return <p className="chip text-ok">🔔 {t("notify.on")}</p>;
  return <button className="btn-ghost" onClick={enable}>🔔 {t("notify.enable")}</button>;
}
