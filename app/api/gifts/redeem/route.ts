import { currentUser, dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  await ensureSchema();
  const { code } = await req.json();
  const u = await currentUser().catch(() => null);
  const rows = (await sql!`UPDATE gifts SET redeemed_by = ${u?.email ?? "anonym"}, redeemed_at = now()
    WHERE code = ${String(code).toUpperCase()} AND redeemed_at IS NULL RETURNING data`) as { data: Record<string, unknown> }[];
  if (!rows.length) return Response.json({ error: "invalid" }, { status: 404 });
  return Response.json({ gift: rows[0].data });
}
