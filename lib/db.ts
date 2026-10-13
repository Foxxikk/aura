import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { seedApplications } from "./data";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const sql = url ? neon(url) : null;
export const dbEnabled = !!sql;

const COOKIE = "aura_session";
let schemaReady: Promise<void> | null = null;

/** Tabulky se založí při prvním požadavku – žádná ruční migrace. */
export function ensureSchema() {
  if (!sql) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'fan', age_confirmed_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL)`;
      await sql`CREATE TABLE IF NOT EXISTS user_state (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, state JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY, data JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY, data JSONB NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS moderation_actions (
        target_id TEXT PRIMARY KEY, kind TEXT NOT NULL, actor TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS gifts (
        code TEXT PRIMARY KEY, data JSONB NOT NULL, buyer TEXT, redeemed_by TEXT, redeemed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`CREATE TABLE IF NOT EXISTS media (
        key TEXT PRIMARY KEY, mime TEXT NOT NULL, data BYTEA NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`;
      const [{ count }] = (await sql`SELECT count(*)::int AS count FROM applications`) as { count: number }[];
      if (count === 0) {
        for (const a of seedApplications) {
          await sql`INSERT INTO applications (id, data, status) VALUES (${a.id}, ${JSON.stringify(a)}::jsonb, ${a.status}) ON CONFLICT DO NOTHING`;
        }
      }
    })().catch((e) => {
      schemaReady = null;
      throw e;
    });
  }
  return schemaReady;
}

export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

function roleFor(email: string) {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase()) ? "admin" : "fan";
}

export async function createUser(email: string, password: string) {
  await ensureSchema();
  const id = crypto.randomUUID();
  await sql!`INSERT INTO users (id, email, password_hash, role, age_confirmed_at) VALUES (${id}, ${email.toLowerCase()}, ${hashPassword(password)}, ${roleFor(email)}, now())`;
  return id;
}

export async function startSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 86_400_000);
  await sql!`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expires.toISOString()})`;
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && sql) await sql`DELETE FROM sessions WHERE token = ${token}`;
  jar.delete(COOKIE);
}

export type SessionUser = { id: string; email: string; role: "fan" | "admin" };

export async function currentUser(): Promise<SessionUser | null> {
  if (!sql) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  await ensureSchema();
  const rows = (await sql`
    SELECT u.id, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()`) as SessionUser[];
  const u = rows[0];
  if (!u) return null;
  // role se může změnit přes ADMIN_EMAILS
  return { ...u, role: roleFor(u.email) === "admin" ? "admin" : u.role };
}

export function noDb() {
  return Response.json({ error: "Databáze není připojená. Aplikace běží v demo režimu." }, { status: 503 });
}
