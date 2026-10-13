import { NextResponse } from "next/server";
import { token } from "@/middleware";

const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) return NextResponse.json({ error: "Příliš mnoho pokusů, zkus to za minutu." }, { status: 429 });
  const { pin } = await req.json().catch(() => ({ pin: "" }));
  const expected = process.env.SITE_PIN || "4321";
  if (String(pin) !== expected) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return NextResponse.json({ error: "Špatný PIN" }, { status: 401 });
  }
  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("aura_gate", await token(expected), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 86400 });
  return res;
}
