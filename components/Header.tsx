"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useStore, type Lang } from "@/lib/store";
import { useT, langNames } from "@/lib/i18n";
import { loyalty } from "@/lib/loyalty";

export default function Header() {
  const path = usePathname();
  const store = useStore();
  const { balance, ready, user, syncState, lang, set } = store;
  const t = useT();
  const lvl = ready ? loyalty(store) : null;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const nav = [
    { href: "/feed", label: t("nav.feed") },
    { href: "/explore", label: t("nav.explore") },
    { href: "/stories", label: t("nav.stories") },
    { href: "/live", label: t("nav.live") },
    { href: "/messages", label: t("nav.messages") },
    { href: "/rewards", label: t("nav.rewards") },
    { href: "/creator", label: t("nav.creator") },
    { href: "/admin", label: t("nav.admin") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="font-display text-3xl italic tracking-tight">
          aura<span className="text-gold">.</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className={`rounded-full px-3 py-1.5 text-sm transition ${path.startsWith(n.href) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <select
            aria-label="Jazyk / Language"
            value={lang}
            onChange={(e) => set(() => ({ lang: e.target.value as Lang }))}
            className="rounded-full border border-line bg-transparent px-2 py-1 text-xs text-muted"
          >
            {(Object.keys(langNames) as Lang[]).map((l) => <option key={l} value={l} className="bg-surface">{l.toUpperCase()}</option>)}
          </select>
          {lvl && (
            <Link href="/rewards" className="chip hidden text-ink sm:inline-flex" title={`${lvl.points} b.`}>
              <span style={{ color: lvl.level.color }}>◆</span> {lvl.level.name[lang]}
            </Link>
          )}
          <Link href="/saved" className="chip hidden text-ink sm:inline-flex" title={t("nav.saved")}>★</Link>
          <Link href="/wallet" className="chip text-ink">
            <span className="text-gold">●</span> {ready ? balance.toFixed(2) : "–"} €
          </Link>
          <Link href="/login" className="chip text-ink" title={user ? (syncState === "synced" ? "DB ✓" : syncState === "saving" ? "…" : "!") : "Demo"}>
            {user ? (
              <>
                <span className={syncState === "error" ? "text-rose" : "text-ok"}>●</span>
                <span className="hidden max-w-28 truncate sm:inline">{user.email}</span>
                <span className="sm:hidden">{t("nav.account")}</span>
              </>
            ) : t("nav.login")}
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className={`shrink-0 rounded-full px-3 py-1 text-xs ${path.startsWith(n.href) ? "bg-surface-2" : "text-muted"}`}>
            {n.label}
          </Link>
        ))}
        <Link href="/wallet" className={`shrink-0 rounded-full px-3 py-1 text-xs ${path.startsWith("/wallet") ? "bg-surface-2" : "text-muted"}`}>{t("nav.wallet")}</Link>
        <Link href="/saved" className={`shrink-0 rounded-full px-3 py-1 text-xs ${path.startsWith("/saved") ? "bg-surface-2" : "text-muted"}`}>{t("nav.saved")}</Link>
      </nav>
    </header>
  );
}
