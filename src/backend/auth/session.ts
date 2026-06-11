import crypto from "node:crypto";
import { query } from "../db";
import type { AuthClaims } from "./firebase";

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 1 week

export interface SessionData {
  userId: string;
  claims: AuthClaims;
}

export async function createSession(data: SessionData): Promise<string> {
  const sid = crypto.randomBytes(32).toString("base64url");
  const expire = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await query("INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)", [
    sid,
    JSON.stringify(data),
    expire,
  ]);
  return sid;
}

export async function getSession(sid: string | undefined | null): Promise<SessionData | null> {
  if (!sid) return null;
  const res = await query<{ sess: SessionData; expire: Date }>(
    "SELECT sess, expire FROM sessions WHERE sid = $1",
    [sid],
  );
  const row = res.rows[0];
  if (!row) return null;
  if (new Date(row.expire).getTime() < Date.now()) {
    await destroySession(sid);
    return null;
  }
  return row.sess;
}

export async function updateSession(sid: string, data: SessionData): Promise<void> {
  await query("UPDATE sessions SET sess = $2 WHERE sid = $1", [sid, JSON.stringify(data)]);
}

export async function destroySession(sid: string | undefined | null): Promise<void> {
  if (!sid) return;
  await query("DELETE FROM sessions WHERE sid = $1", [sid]);
}

export const SESSION_COOKIE = "sid";
export { SESSION_TTL_SECONDS };
