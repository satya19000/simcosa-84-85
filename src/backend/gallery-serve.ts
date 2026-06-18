import { query } from "./db";
import { parseCookies } from "./auth/cookies";
import { getSession, SESSION_COOKIE } from "./auth/session";
import { getProfile, isAdmin } from "./auth/service";

// GET /api/gallery/:id — stream stored media bytes to approved members.
export async function serveGallery(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/api\/gallery\/([^/]+)$/);
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
  const res = await query<{ data: Buffer | null; mime: string | null }>(
    `SELECT data, mime FROM gallery_items WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row || !row.data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.data), {
    status: 200,
    headers: {
      "Content-Type": row.mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
