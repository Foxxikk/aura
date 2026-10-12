import { currentUser, dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (u?.role !== "admin") return Response.json({ error: "Jen pro administrátory" }, { status: 403 });
  const rows = (await sql!`SELECT data, status FROM applications ORDER BY created_at DESC`) as { data: Record<string, unknown>; status: string }[];
  return Response.json({ applications: rows.map((r) => ({ ...r.data, status: r.status })) });
}

export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  await ensureSchema();
  const a = await req.json();
  const id = crypto.randomUUID();
  const data = {
    id, studio: String(a.studio ?? "").slice(0, 120), personaName: String(a.personaName ?? "").slice(0, 120),
    email: String(a.email ?? "").slice(0, 200), country: String(a.country ?? "").slice(0, 80),
    concept: String(a.concept ?? "").slice(0, 2000), categories: Array.isArray(a.categories) ? a.categories.slice(0, 8).map(String) : [],
    submittedAt: new Date().toISOString().slice(0, 10), kyc: "pending", status: "pending",
    card: a.card && typeof a.card === "object" && JSON.stringify(a.card).length < 6000 ? a.card : undefined,
  };
  await sql!`INSERT INTO applications (id, data, status) VALUES (${id}, ${JSON.stringify(data)}::jsonb, 'pending')`;
  return Response.json({ ok: true, id });
}

export async function PATCH(req: Request) {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (u?.role !== "admin") return Response.json({ error: "Jen pro administrátory" }, { status: 403 });
  const { id, status, note, kyc } = await req.json();
  if (!["pending", "approved", "rejected", "suspended"].includes(status)) return Response.json({ error: "Neplatný stav" }, { status: 400 });
  const patch = JSON.stringify({ status, ...(note !== undefined ? { note } : {}), ...(kyc ? { kyc } : {}), reviewedBy: u.email, reviewedAt: new Date().toISOString() });
  await sql!`UPDATE applications SET status = ${status}, data = data || ${patch}::jsonb WHERE id = ${id}`;
  return Response.json({ ok: true });
}
