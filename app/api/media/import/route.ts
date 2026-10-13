import { createHash } from "node:crypto";
import { dbEnabled, ensureSchema, noDb, sql } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Import testovacích médií z Figmy (AI generované). Klíč je uložen jen jako hash.
const KEY_HASH = "944e4353d3a40c019d41dfc3f207aa8ebf94102b17616a5ee2016230045bd2f4";
const ALLOWED = /^https:\/\/(www\.)?figma\.com\/api\/mcp\/asset\/[\w-]+(\.(png|jpg))?$/;

export async function GET(req: Request) {
  if (!dbEnabled) return noDb();
  const q = new URL(req.url).searchParams;
  const key = q.get("key") ?? "";
  if (createHash("sha256").update(key).digest("hex") !== KEY_HASH) return Response.json({ error: "forbidden" }, { status: 403 });
  const name = q.get("name") ?? "";
  const src = q.get("url") ?? "";
  if (!/^[a-z0-9-]{2,60}$/.test(name) || !ALLOWED.test(src)) return Response.json({ error: "bad input" }, { status: 400 });
  const r = await fetch(src);
  if (!r.ok) return Response.json({ error: "fetch " + r.status }, { status: 502 });
  const mime = r.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  if (!mime.startsWith("image/")) return Response.json({ error: "not image" }, { status: 400 });
  const buf = Buffer.from(await r.arrayBuffer());
  await ensureSchema();
  await sql!`INSERT INTO media (key, mime, data) VALUES (${name}, ${mime}, ${"\\x" + buf.toString("hex")})
    ON CONFLICT (key) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()`;
  return Response.json({ ok: true, name, mime, bytes: buf.length });
}
