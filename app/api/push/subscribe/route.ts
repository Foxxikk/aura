import { currentUser, dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (!u) return Response.json({ error: "Nepřihlášen" }, { status: 401 });
  const sub = await req.json();
  if (!sub?.endpoint) return Response.json({ error: "Neplatná subscription" }, { status: 400 });
  await ensureSchema();
  await sql!`INSERT INTO push_subscriptions (endpoint, user_id, data) VALUES (${sub.endpoint}, ${u.id}, ${JSON.stringify(sub)}::jsonb)
    ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, data = EXCLUDED.data`;
  return Response.json({ ok: true });
}
