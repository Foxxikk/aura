import { currentUser, dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Souhrnné KPI platformy z databáze. Útraty se počítají z uložených transakcí uživatelů (demo kredit). */
export async function GET() {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (u?.role !== "admin") return Response.json({ error: "Jen pro administrátory" }, { status: 403 });
  await ensureSchema();
  const one = async <T,>(q: Promise<unknown>) => ((await q) as T[])[0];
  const users = await one<{ total: number; week: number }>(sql!`SELECT count(*)::int AS total, count(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS week FROM users`);
  const spend = await one<{ total: number; buyers: number }>(sql!`
    SELECT COALESCE(SUM(-(t->>'amount')::numeric), 0)::float AS total, COUNT(DISTINCT us.user_id)::int AS buyers
    FROM user_state us, jsonb_array_elements(COALESCE(us.state->'transactions', '[]'::jsonb)) t
    WHERE (t->>'amount')::numeric < 0`);
  const subs = await one<{ n: number }>(sql!`SELECT COUNT(*)::int AS n FROM user_state us, jsonb_object_keys(COALESCE(us.state->'subscriptions', '{}'::jsonb)) k`);
  const byPersona = (await sql!`
    SELECT t->>'personaId' AS persona, SUM(-(t->>'amount')::numeric)::float AS revenue
    FROM user_state us, jsonb_array_elements(COALESCE(us.state->'transactions', '[]'::jsonb)) t
    WHERE (t->>'amount')::numeric < 0 AND t->>'personaId' IS NOT NULL
    GROUP BY 1 ORDER BY 2 DESC LIMIT 10`) as { persona: string; revenue: number }[];
  const reports = await one<{ open: number; total: number }>(sql!`SELECT count(*) FILTER (WHERE status = 'open')::int AS open, count(*)::int AS total FROM reports`);
  const apps = await one<{ pending: number }>(sql!`SELECT count(*) FILTER (WHERE status = 'pending')::int AS pending FROM applications`);
  const push = await one<{ n: number }>(sql!`SELECT count(*)::int AS n FROM push_subscriptions`);
  return Response.json({ users, spend, subs: subs.n, byPersona, reports, apps, push: push.n });
}
