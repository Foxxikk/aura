import { currentUser, dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Nahlášení od uživatele nebo z automatického filtru. */
export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  await ensureSchema();
  const r = await req.json();
  const u = await currentUser().catch(() => null);
  const data = {
    id: crypto.randomUUID(),
    target: ["post", "message", "persona", "live"].includes(r.target) ? r.target : "post",
    targetId: String(r.targetId ?? "").slice(0, 120),
    personaId: r.personaId ? String(r.personaId).slice(0, 40) : undefined,
    reason: String(r.reason ?? "other").slice(0, 40),
    note: r.note ? String(r.note).slice(0, 500) : undefined,
    excerpt: r.excerpt ? String(r.excerpt).slice(0, 200) : undefined,
    source: r.source === "auto" ? "auto" : "user",
    reporter: u?.email,
    createdAt: Date.now(),
  };
  await sql!`INSERT INTO reports (id, data) VALUES (${data.id}, ${JSON.stringify(data)}::jsonb)`;
  return Response.json({ ok: true });
}

export async function GET() {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (u?.role !== "admin") return Response.json({ error: "Jen pro administrátory" }, { status: 403 });
  const rows = (await sql!`SELECT data, status FROM reports ORDER BY created_at DESC LIMIT 200`) as { data: Record<string, unknown>; status: string }[];
  return Response.json({ reports: rows.map((r) => ({ ...r.data, status: r.status })) });
}

/** Rozhodnutí admina: ponechat / skrýt obsah / pozastavit personu. */
export async function PATCH(req: Request) {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (u?.role !== "admin") return Response.json({ error: "Jen pro administrátory" }, { status: 403 });
  const { id, status, targetId, personaId, undo } = await req.json();
  if (undo) {
    await sql!`DELETE FROM moderation_actions WHERE target_id = ${String(undo)}`;
    return Response.json({ ok: true });
  }
  if (!["kept", "hidden", "suspended"].includes(status)) return Response.json({ error: "Neplatný stav" }, { status: 400 });
  await sql!`UPDATE reports SET status = ${status} WHERE id = ${id}`;
  if (status === "hidden" && targetId) await sql!`INSERT INTO moderation_actions (target_id, kind, actor) VALUES (${targetId}, 'hidden', ${u.email}) ON CONFLICT (target_id) DO UPDATE SET kind = 'hidden'`;
  if (status === "suspended" && personaId) await sql!`INSERT INTO moderation_actions (target_id, kind, actor) VALUES (${personaId}, 'suspended', ${u.email}) ON CONFLICT (target_id) DO UPDATE SET kind = 'suspended'`;
  return Response.json({ ok: true });
}
