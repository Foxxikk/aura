import type { Persona } from "@/lib/data";

/** Abstraktní „portrét“ – v produkci nahradí skutečné AI fotky persony. */
export function Avatar({ p, size = 48, ring = false }: { p: Persona; size?: number; ring?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ${ring ? "ring-2 ring-gold ring-offset-2 ring-offset-bg" : ""}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 30%, hsl(${p.hue} 80% 78%), hsl(${p.hue} 55% 45%) 45%, hsl(${p.hue2} 50% 18%))`,
      }}
    >
      <div
        className="absolute left-1/2 top-[58%] -translate-x-1/2 rounded-full"
        style={{ width: size * 0.9, height: size * 0.9, background: `hsl(${p.hue2} 40% 12% / .55)`, filter: "blur(2px)" }}
      />
      <div
        className="absolute left-1/2 top-[22%] -translate-x-1/2 rounded-full"
        style={{ width: size * 0.36, height: size * 0.36, background: `hsl(${p.hue} 60% 85% / .5)`, filter: "blur(1px)" }}
      />
    </div>
  );
}

export function Cover({ p, className = "" }: { p: Persona; className?: string }) {
  return (
    <div
      className={`grain relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(120deg, hsl(${p.hue} 60% 30%), hsl(${p.hue2} 55% 22%) 55%, #0d0a0c), radial-gradient(circle at 80% 20%, hsl(${p.hue} 90% 70% / .5), transparent 50%)`,
        backgroundBlendMode: "screen",
      }}
    >
      <div
        className="absolute -right-10 -top-10 h-64 w-64 rounded-full blur-3xl"
        style={{ background: `hsl(${p.hue} 90% 65% / .35)` }}
      />
    </div>
  );
}

export function MediaTile({ hue, locked, className = "" }: { hue: number; locked?: boolean; className?: string }) {
  return (
    <div className={`grain relative overflow-hidden ${className}`}>
      <div
        className={`absolute inset-0 ${locked ? "scale-110 blur-2xl" : ""}`}
        style={{
          background: `radial-gradient(ellipse at 30% 25%, hsl(${hue} 85% 75%), transparent 55%), radial-gradient(ellipse at 75% 80%, hsl(${(hue + 60) % 360} 60% 45%), transparent 60%), linear-gradient(160deg, hsl(${hue} 45% 30%), hsl(${(hue + 200) % 360} 35% 12%))`,
        }}
      />
      {!locked && (
        <div
          className="absolute bottom-0 left-1/2 h-3/5 w-2/5 -translate-x-1/2 rounded-t-full"
          style={{ background: `linear-gradient(hsl(${hue} 30% 15% / .7), hsl(${hue} 30% 8% / .9))`, filter: "blur(6px)" }}
        />
      )}
    </div>
  );
}
