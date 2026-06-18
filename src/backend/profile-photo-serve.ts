import { query } from "./db";
import { parseCookies } from "./auth/cookies";
import { getSession, SESSION_COOKIE } from "./auth/session";
import { getProfile, isAdmin } from "./auth/service";

// GET /api/profile-photo/:userId — stream a member's stored profile photo.
// A user can always view their own photo (signup preview); admins can view
// any photo (to review pending signups); everyone else must be an approved
// member to view other members' photos.
export async function serveProfilePhoto(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/api\/profile-photo\/([^/]+)$/);
  if (!match) return null;

  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const userId = decodeURIComponent(match[1]);

  if (session.userId !== userId) {
    const [profile, admin] = await Promise.all([
      getProfile(session.userId),
      isAdmin(session.userId),
    ]);
    if (!admin && profile?.approval_status !== "approved") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const res = await query<{ data: Buffer | null; mime: string | null }>(
    `SELECT data, mime FROM profile_photos WHERE user_id = $1`,
    [userId],
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
