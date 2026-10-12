import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Header from "@/components/Header";
import AgeGate from "@/components/AgeGate";
import Footer from "@/components/Footer";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Aura – AI tvůrci",
  description: "Prémiová platforma pro AI persony a jejich fanoušky. Pouze 18+.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  appleWebApp: { capable: true, title: "Aura", statusBarStyle: "black-translucent" },
};

export const viewport = { themeColor: "#0d0a0c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body className="min-h-screen">
        <StoreProvider>
          <AgeGate />
          <Header />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
          <Footer />
          <ServiceWorker />
        </StoreProvider>
      </body>
    </html>
  );
}
