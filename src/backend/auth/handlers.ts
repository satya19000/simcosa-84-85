import { parseCookies, serializeCookie, clearCookie } from "./cookies";
import {
  createSession,
  destroySession,
  getSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "./session";
import { upsertUserFromClaims, getProfile, isAdmin } from "./service";
import { verifyFirebaseToken, type AuthClaims } from "./firebase";

function json(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}

// POST /api/session — exchange a verified Firebase ID token for a server session.
// New users are upserted with a member profile (approved=true) automatically.
export async function handleSession(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  let idToken: string | undefined;
  try {
    const body = (await request.json()) as { idToken?: string };
    idToken = body?.idToken;
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!idToken) return json({ error: "Missing idToken" }, { status: 400 });

  let claims: AuthClaims;
  try {
    claims = await verifyFirebaseToken(idToken);
  } catch (err) {
    console.error("[auth] token verification failed", err);
    return json({ error: "Invalid token" }, { status: 401 });
  }

  await upsertUserFromClaims(claims);
  const sid = await createSession({ userId: claims.sub, claims });
  const cookie = serializeCookie(SESSION_COOKIE, sid, {
    maxAge: SESSION_TTL_SECONDS,
    sameSite: "Lax",
  });

  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}

// POST /api/logout — destroy the server session and clear the cookie.
export async function handleLogout(request: Request): Promise<Response> {
  const cookies = parseCookies(request.headers.get("cookie"));
  await destroySession(cookies[SESSION_COOKIE]);
  return json({ ok: true }, { headers: { "Set-Cookie": clearCookie(SESSION_COOKIE) } });
}

// GET /api/auth/user — current user as JSON
export async function handleAuthUser(request: Request): Promise<Response> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) {
    return json({ authenticated: false });
  }
  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId),
  ]);
  return json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.claims.email ?? null,
      first_name: session.claims.first_name ?? null,
      last_name: session.claims.last_name ?? null,
      profile_image_url: session.claims.profile_image_url ?? null,
    },
    profile,
    isAdmin: admin,
  });
}

const ROUTES: Record<string, (req: Request) => Promise<Response>> = {
  "/api/session": handleSession,
  "/api/logout": handleLogout,
  "/api/auth/user": handleAuthUser,
};

// Returns a Response if the path is an auth route, otherwise null.
export async function handleAuthRoute(request: Request): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const handler = ROUTES[pathname];
  if (!handler) return null;
  return handler(request);
}
