import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import AgeGate from "@/components/AgeGate";

export const metadata: Metadata = {
  title: "Aura – AI tvůrci",
  description: "Prémiová platforma pro AI persony a jejich fanoušky. Pouze 18+.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen">
        <StoreProvider>
          <AgeGate />
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
          <footer className="border-t border-line py-8 text-center text-xs text-muted">
            Aura · Všechny persony na platformě jsou AI a jsou tak označeny · Pouze 18+ · Demo MVP, platby jsou simulované
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}
