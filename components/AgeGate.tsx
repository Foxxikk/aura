"use client";

import { useStore } from "@/lib/store";

export default function AgeGate() {
  const { ready, ageVerified, set } = useStore();
  if (!ready || ageVerified) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="card max-w-md p-8 text-center">
        <p className="font-display text-5xl italic">aura<span className="text-gold">.</span></p>
        <h2 className="mt-4 text-lg font-semibold">Obsah pouze pro dospělé</h2>
        <p className="mt-2 text-sm text-muted">
          Aura je platforma pro AI persony. Veškerý obsah i chat jsou generované umělou inteligencí a jsou tak
          označené. Vstupem potvrzuješ, že ti je alespoň 18 let.
        </p>
        <p className="mt-2 text-xs text-muted">V produkci zde proběhne ověření věku přes externího poskytovatele.</p>
        <div className="mt-6 flex flex-col gap-2">
          <button className="btn-primary" onClick={() => set(() => ({ ageVerified: true }))}>
            Je mi 18+, vstoupit
          </button>
          <a className="btn-ghost" href="https://www.google.com">
            Odejít
          </a>
        </div>
      </div>
    </div>
  );
}
