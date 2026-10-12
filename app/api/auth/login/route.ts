import { dbEnabled, ensureSchema, noDb, sql, startSession, verifyPassword } from "@/lib/db";

export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  const { email, password } = await req.json();
  await ensureSchema();
  const rows = (await sql!`SELECT id, password_hash FROM users WHERE email = ${String(email).toLowerCase()}`) as { id: string; password_hash: string }[];
  const u = rows[0];
  if (!u || !verifyPassword(String(password), u.password_hash)) return Response.json({ error: "Špatný e-mail nebo heslo." }, { status: 401 });
  await startSession(u.id);
  return Response.json({ ok: true });
}
