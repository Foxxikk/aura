import { currentUser, dbEnabled, noDb, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (!u) return Response.json({ error: "Nepřihlášen" }, { status: 401 });
  const rows = (await sql!`SELECT state FROM user_state WHERE user_id = ${u.id}`) as { state: unknown }[];
  return Response.json({ state: rows[0]?.state ?? null });
}

export async function PUT(req: Request) {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (!u) return Response.json({ error: "Nepřihlášen" }, { status: 401 });
  const { state } = await req.json();
  const json = JSON.stringify(state ?? {});
  if (json.length > 900_000) return Response.json({ error: "Stav je příliš velký" }, { status: 413 });
  await sql!`INSERT INTO user_state (user_id, state, updated_at) VALUES (${u.id}, ${json}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`;
  return Response.json({ ok: true });
}
