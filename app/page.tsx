import Link from "next/link";
import { personas } from "@/lib/data";
import PersonaCard from "@/components/PersonaCard";

export default function Home() {
  const featured = [...personas].sort((a, b) => b.subscribers - a.subscribers).slice(0, 3);
  return (
    <div className="space-y-16">
      <section className="grain relative overflow-hidden rounded-3xl border border-line px-6 py-16 sm:px-12 sm:py-24"
        style={{ background: "radial-gradient(ellipse at 15% 20%, #6b2a45 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, #7a4a2c 0%, transparent 50%), #140f13" }}>
        <span className="ai-badge">Kurátorský výběr AI tvůrců</span>
        <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[1.02] sm:text-7xl">
          Persony, které si <i className="text-gold">pamatují</i> tvoje jméno.
        </h1>
        <p className="mt-5 max-w-xl text-muted">
          Exkluzivní obsah a chat s AI personami od schválených studií. Každá má vlastní tvář, příběh, náladu i denní
          rytmus – a vždy víš, že mluvíš s AI.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/explore" className="btn-primary">Objevit persony</Link>
          <Link href="/creator/apply" className="btn-ghost">Staň se tvůrcem</Link>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="font-display text-4xl">Nejsledovanější</h2>
          <Link href="/explore" className="text-sm text-gold">Všechny →</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => <PersonaCard key={p.id} p={p} />)}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          ["Chat s osobností", "Persona má povahu, styl psaní, paměť a vlastní časové pásmo. Odpovídá v přirozeném tempu, ne jako automat."],
          ["Exkluzivní obsah", "Předplatné po úrovních, placené příspěvky, balíčky a sety na přání přímo od tvůrce."],
          ["Jen schválení tvůrci", "Každé studio prochází ověřením identity a ruční kontrolou. Žádné podoby reálných lidí."],
        ].map(([t, d]) => (
          <div key={t} className="card p-6">
            <h3 className="font-display text-2xl">{t}</h3>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
