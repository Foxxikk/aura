import { createUser, dbEnabled, noDb, sql, startSession } from "@/lib/db";

export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  const { email, password, ageConfirmed, referralCode, referredBy } = await req.json();
  if (!ageConfirmed) return Response.json({ error: "Je nutné potvrdit věk 18+." }, { status: 400 });
  if (typeof email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: "Neplatný e-mail." }, { status: 400 });
  if (typeof password !== "string" || password.length < 8) return Response.json({ error: "Heslo musí mít alespoň 8 znaků." }, { status: 400 });
  try {
    const existing = await sql!`SELECT 1 FROM users WHERE email = ${email.toLowerCase()}`.catch(() => []);
    if ((existing as unknown[]).length) return Response.json({ error: "Účet s tímto e-mailem už existuje." }, { status: 409 });
    const id = await createUser(email, password);
    const code = typeof referralCode === "string" ? referralCode.slice(0, 12).toUpperCase() : null;
    const ref = typeof referredBy === "string" ? referredBy.slice(0, 12).toUpperCase() : null;
    await sql!`UPDATE users SET referral_code = ${code}, referred_by = ${ref} WHERE id = ${id}`;
    await startSession(id);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Registrace se nezdařila." }, { status: 500 });
  }
}
