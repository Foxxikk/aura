import { dbEnabled, ensureSchema, sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Veřejný seznam skrytého obsahu a pozastavených person (aplikují se všem návštěvníkům). */
export async function GET() {
  if (!dbEnabled) return Response.json({ hidden: [], suspended: [] });
  try {
    await ensureSchema();
    const rows = (await sql!`SELECT target_id, kind FROM moderation_actions`) as { target_id: string; kind: string }[];
    return Response.json({
      hidden: rows.filter((r) => r.kind === "hidden").map((r) => r.target_id),
      suspended: rows.filter((r) => r.kind === "suspended").map((r) => r.target_id),
    });
  } catch {
    return Response.json({ hidden: [], suspended: [] });
  }
}
