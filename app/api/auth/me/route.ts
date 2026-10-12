import { currentUser, dbEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json({ dbEnabled, user: await currentUser() });
  } catch (e) {
    console.error(e);
    return Response.json({ dbEnabled, user: null, error: "db" });
  }
}
