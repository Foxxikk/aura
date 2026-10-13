import type { Persona } from "@/lib/data";

/**
 * Testovací obsah: AI generované fotky (Figma, soubor „AI Design System – Test Claude“, sekce Aura) v /public/media.
 * V produkci obsah tvůrce z úložiště s podepsanými URL.
 */
const MEDIA = /^p[1-6]-(post-[0-5]|portrait)$/;
export function mediaSrc(key?: string) {
  return key && MEDIA.test(key) ? `/media/${key}.jpg` : undefined;
}
/** Které fotky se použijí jako cover persony (široký ořez). */
const COVER_POST: Record<string, number> = { p1: 3, p2: 3, p3: 2, p4: 2, p5: 2, p6: 2 };

/** Abstraktní „portrét“ – v produkci nahradí skutečné AI fotky persony. */
export function Avatar({ p, size = 48, ring = false }: { p: Persona; size?: number; ring?: boolean }) {
  const portrait = p.portrait ?? mediaSrc(`${p.id}-portrait`);
  if (portrait) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={portrait} alt={p.name} width={size} height={size} loading="lazy"
        className={`shrink-0 rounded-full object-cover ${ring ? "ring-2 ring-gold ring-offset-2 ring-offset-bg" : ""}`} style={{ width: size, height: size }} />
    );
  }
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
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaSrc(`${p.id}-post-${COVER_POST[p.id] ?? 0}`)} alt="" loading="lazy" className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_40%] blur-[1.5px] brightness-90" />
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, rgba(13,10,12,.85)), linear-gradient(120deg, hsl(${p.hue} 60% 30% / .35), transparent 60%)` }} />
    </div>
  );
}

export function CoverGradient({ p, className = "" }: { p: Persona; className?: string }) {
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

export function MediaTile({ hue, locked, className = "", seed }: { hue: number; locked?: boolean; className?: string; seed?: string }) {
  const src = mediaSrc(seed);
  if (src) {
    return (
      <div className={`overflow-hidden bg-surface-2 ${className.includes("absolute") ? "" : "relative"} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" draggable={false}
          className={`absolute inset-0 h-full w-full object-cover ${locked ? "scale-125 blur-2xl brightness-75" : ""}`} />
      </div>
    );
  }
  return (
    <div className={`grain overflow-hidden ${className.includes("absolute") ? "" : "relative"} ${className}`}>
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
