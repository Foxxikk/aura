import { currentUser, dbEnabled, endSession, noDb, sql } from "@/lib/db";

/** Smazání účtu: uživatel, relace, uložený stav a push odběry (kaskádově). Nahlášení zůstávají anonymizovaná. */
export async function DELETE() {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (!u) return Response.json({ error: "Nepřihlášen" }, { status: 401 });
  await sql!`UPDATE reports SET data = data - 'reporter' WHERE data->>'reporter' = ${u.email}`;
  await sql!`DELETE FROM users WHERE id = ${u.id}`;
  await endSession();
  return Response.json({ ok: true });
}
