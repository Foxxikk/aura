"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/i18n";

export default function Invite() {
  const { referralCode, referredBy, referralCredits, user, ready, lang } = useStore();
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [signups, setSignups] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    if (user) fetch("/api/referrals").then((r) => r.json()).then((j) => setSignups(j.signups)).catch(() => {});
  }, [user]);

  if (!ready) return null;
  const link = `${origin}/?ref=${referralCode}`;
  const seed = referralCode.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  // Bez databáze ukázková čísla; s ní skutečné registrace přes kód
  const stats = {
    clicks: 12 + (seed % 30),
    signups: signups ?? 2 + (seed % 5),
    buyers: Math.min(signups ?? 2 + (seed % 5), 1 + (seed % 3)),
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-5xl">{t("invite.title")}</h1>
      <p className="text-muted">{t("invite.lead")}</p>
      {referredBy && <p className="rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm text-gold">{t("invite.referred", { code: referredBy })}</p>}

      <div className="card p-6">
        <p className="text-sm font-medium">{t("invite.link")}</p>
        <div className="mt-2 flex gap-2">
          <input className="input font-mono" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button className="btn-primary shrink-0" onClick={copy}>{copied ? t("invite.copied") : t("invite.copy")}</button>
        </div>
        <p className="mt-2 text-xs text-muted">Kód: <b className="font-mono text-ink">{referralCode}</b></p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">{t("invite.stats")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            [t("invite.clicks"), stats.clicks],
            [t("invite.signups"), stats.signups],
            [t("invite.buyers"), stats.buyers],
            [t("invite.earned"), `${(referralCredits || stats.buyers * 5).toLocaleString(lang)} €`],
          ].map(([l, v]) => (
            <div key={String(l)}>
              <p className="text-xs text-muted">{l}</p>
              <p className="font-display text-3xl">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted">{signups === null ? "Demo: ukázková čísla. Po přihlášení s databází se ukazují skutečné registrace." : "Registrace jsou skutečné z databáze; kliknutí a nákupy zatím odhad."}</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">{t("invite.creators")}</h2>
        <p className="mt-1 text-sm text-muted">{t("invite.creatorsLead")}</p>
        <a href="/creator/apply" className="btn-ghost mt-4">{t("home.creator")}</a>
      </div>
    </div>
  );
}
