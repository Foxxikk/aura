import webpush from "web-push";
import { currentUser, dbEnabled, noDb, sql } from "@/lib/db";

/** Admin: odešle push notifikaci všem (nebo jednomu uživateli). Vyžaduje VAPID klíče v prostředí. */
export async function POST(req: Request) {
  if (!dbEnabled) return noDb();
  const u = await currentUser();
  if (u?.role !== "admin") return Response.json({ error: "Jen pro administrátory" }, { status: 403 });
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return Response.json({ error: "Chybí VAPID klíče (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)." }, { status: 503 });
  webpush.setVapidDetails(`mailto:${u.email}`, pub, priv);
  const { title, body, url, userId } = await req.json();
  const rows = (userId
    ? await sql!`SELECT endpoint, data FROM push_subscriptions WHERE user_id = ${userId}`
    : await sql!`SELECT endpoint, data FROM push_subscriptions`) as { endpoint: string; data: webpush.PushSubscription }[];
  let sent = 0;
  for (const r of rows) {
    try {
      await webpush.sendNotification(r.data, JSON.stringify({ title, body, url }));
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) await sql!`DELETE FROM push_subscriptions WHERE endpoint = ${r.endpoint}`;
    }
  }
  return Response.json({ ok: true, sent, total: rows.length });
}
