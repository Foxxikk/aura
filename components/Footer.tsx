"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import InstallPrompt from "./InstallPrompt";

export default function Footer() {
  const t = useT();
  return (
    <footer className="border-t border-line py-8 text-center text-xs text-muted">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-3">
        <Link href="/invite" className="underline">{t("invite.title")}</Link>
        <Link href="/gift" className="underline">{t("nav.gift")}</Link>
        <Link href="/saved" className="underline">{t("nav.saved")}</Link>
        <Link href="/privacy" className="underline">{t("nav.privacy")}</Link>
        <InstallPrompt />
      </div>
      {t("footer")}
    </footer>
  );
}
