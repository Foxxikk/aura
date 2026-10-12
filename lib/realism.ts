import type { Persona } from "./data";

export function localHour(tz: string, date = new Date()) {
  const h = new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: tz }).format(date);
  return Number(h) % 24;
}

export function localTime(tz: string, date = new Date()) {
  return new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: tz }).format(date);
}

export function isAwake(p: Persona, hour = localHour(p.timezone)) {
  const { wake, sleep } = p.schedule;
  const s = sleep % 24;
  if (wake < s) return hour >= wake && hour < s;
  return hour >= wake || hour < s;
}

export function presence(p: Persona) {
  if (!isAwake(p)) return { label: "Spí – odpoví ráno", tone: "sleep" as const };
  const seed = (p.id.charCodeAt(1) + new Date().getMinutes()) % 10;
  if (seed < 6) return { label: "Online", tone: "online" as const };
  return { label: `Aktivní před ${seed * 3} min`, tone: "away" as const };
}

/** Jak dlouho bude persona „číst“ a „psát“ odpověď. */
export function replyTiming(p: Persona, fanText: string, replyText: string, opts: { vip: boolean; fast: boolean }) {
  const awake = isAwake(p);
  const jitter = () => 0.7 + Math.random() * 0.6;
  // čas do přečtení zprávy
  let readDelay = awake ? (8_000 + Math.random() * 60_000) * (opts.vip ? 0.4 : 1) : hoursUntilWake(p) * 3_600_000;
  // psaní ~ 6 znaků za sekundu, min 2,5 s
  let typing = Math.max(2_500, (replyText.length / 6) * 1000 * jitter());
  if (fanText.trim().endsWith("?")) readDelay *= 0.8;
  if (opts.fast) {
    readDelay = awake ? 1_500 + Math.random() * 3_000 : 6_000;
    typing = Math.min(typing, 2_000 + replyText.length * 25);
  }
  return { readDelay, typing, awake };
}

function hoursUntilWake(p: Persona) {
  const h = localHour(p.timezone);
  return (p.schedule.wake - h + 24) % 24 || 1;
}
