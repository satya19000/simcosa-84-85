import { query } from "./db";
import { parseCookies } from "./auth/cookies";
import { getSession, SESSION_COOKIE } from "./auth/session";
import { getProfile, isAdmin } from "./auth/service";

// GET /api/events/cover/:id — stream an event's stored cover image to approved members.
export async function serveEventCover(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/api\/events\/cover\/([^/]+)$/);
  if (!match) return null;

  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId),
  ]);
  if (!admin && profile?.approval_status !== "approved") {
    return new Response("Forbidden", { status: 403 });
  }

  const id = decodeURIComponent(match[1]);
  const res = await query<{ cover_data: Buffer | null; cover_mime: string | null }>(
    `SELECT cover_data, cover_mime FROM events WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row || !row.cover_data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.cover_data), {
    status: 200,
    headers: {
      "Content-Type": row.cover_mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
