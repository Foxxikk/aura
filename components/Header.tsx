"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const nav = [
  { href: "/explore", label: "Objevit" },
  { href: "/messages", label: "Zprávy" },
  { href: "/wallet", label: "Peněženka" },
  { href: "/creator", label: "Pro tvůrce" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  const path = usePathname();
  const { balance, ready, user, syncState } = useStore();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="font-display text-3xl italic tracking-tight">
          aura<span className="text-gold">.</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                path.startsWith(n.href) ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/wallet" className="ml-auto chip text-ink md:ml-0">
          <span className="text-gold">●</span> {ready ? balance.toFixed(2) : "–"} €
        </Link>
        <Link href="/login" className="chip text-ink" title={user ? (syncState === "synced" ? "Uloženo v databázi" : syncState === "saving" ? "Ukládám…" : "Chyba synchronizace") : "Demo režim – data jen v tomto prohlížeči"}>
          {user ? (
            <>
              <span className={syncState === "error" ? "text-rose" : "text-ok"}>●</span>
              <span className="hidden max-w-28 truncate sm:inline">{user.email}</span>
              <span className="sm:hidden">Účet</span>
            </>
          ) : (
            "Přihlásit"
          )}
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 rounded-full px-3 py-1 text-xs ${path.startsWith(n.href) ? "bg-surface-2" : "text-muted"}`}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
