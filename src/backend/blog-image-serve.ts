import { query } from "./db";
import { parseCookies } from "./auth/cookies";
import { getSession, SESSION_COOKIE } from "./auth/session";
import { getProfile, isAdmin } from "./auth/service";

// GET /api/blogs/image/:id — stream a blog's stored cover image to approved members.
export async function serveBlogImage(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/api\/blogs\/image\/([^/]+)$/);
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
  const res = await query<{ image_data: Buffer | null; image_mime: string | null }>(
    `SELECT image_data, image_mime FROM blogs WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row || !row.image_data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.image_data), {
    status: 200,
    headers: {
      "Content-Type": row.image_mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
