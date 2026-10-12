import { currentUser, dbEnabled, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Kolik lidí se zaregistrovalo přes kód přihlášeného uživatele. */
export async function GET() {
  if (!dbEnabled) return Response.json({ signups: null });
  const u = await currentUser();
  if (!u) return Response.json({ signups: null });
  const [me] = (await sql!`SELECT referral_code FROM users WHERE id = ${u.id}`) as { referral_code: string | null }[];
  if (!me?.referral_code) return Response.json({ signups: 0, code: null });
  const [{ count }] = (await sql!`SELECT count(*)::int AS count FROM users WHERE referred_by = ${me.referral_code}`) as { count: number }[];
  return Response.json({ signups: count, code: me.referral_code });
}
