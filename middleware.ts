import { NextResponse, type NextRequest } from "next/server";

/** Testovací zámek celé platformy PINem (ověření na serveru, httpOnly cookie). */
export const config = {
  matcher: ["/((?!_next/|api/pin|pin|icon|manifest.webmanifest|sw.js|favicon).*)"],
};

export async function middleware(req: NextRequest) {
  const pin = process.env.SITE_PIN || "4321";
  const expected = await token(pin);
  if (req.cookies.get("aura_gate")?.value === expected) return NextResponse.next();
  if (req.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Zamčeno" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/pin";
  url.search = `?next=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export async function token(pin: string) {
  const data = new TextEncoder().encode(`aura-gate:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
