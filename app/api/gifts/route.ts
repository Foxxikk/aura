import { currentUser, dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

/** Uloží zakoupený dárek, aby ho šlo uplatnit z jiného účtu. */
export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  await ensureSchema();
  const g = await req.json();
  if (!/^AURA-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(String(g.code))) return Response.json({ error: "Neplatný kód" }, { status: 400 });
  const u = await currentUser().catch(() => null);
  const data = { code: g.code, kind: g.kind === "card" ? "card" : "sub", personaId: g.personaId, tier: g.tier, months: Number(g.months) || undefined, amount: Number(g.amount) || undefined, to: String(g.to ?? "").slice(0, 80), message: String(g.message ?? "").slice(0, 300), createdAt: Date.now() };
  await sql!`INSERT INTO gifts (code, data, buyer) VALUES (${g.code}, ${JSON.stringify(data)}::jsonb, ${u?.email ?? null}) ON CONFLICT DO NOTHING`;
  return Response.json({ ok: true });
}
