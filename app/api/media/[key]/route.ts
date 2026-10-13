import { dbEnabled, ensureSchema, sql } from "@/lib/db";

/** Testovací média z databáze (za PINem). V produkci úložiště s podepsanými URL. */
export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const name = key.replace(/\.(jpg|jpeg|png)$/, "");
  if (!dbEnabled || !/^[a-z0-9-]{2,60}$/.test(name)) return new Response("Not found", { status: 404 });
  await ensureSchema();
  const rows = (await sql!`SELECT mime, encode(data, 'base64') AS b64, extract(epoch from updated_at)::bigint AS v FROM media WHERE key = ${name}`) as { mime: string; b64: string; v: number }[];
  if (!rows.length) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(rows[0].b64, "base64"), {
    headers: { "content-type": rows[0].mime, "cache-control": "private, max-age=86400", etag: `"${name}-${rows[0].v}"` },
  });
}
