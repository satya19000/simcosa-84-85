import { client, getOidcConfig, SCOPES, type OidcClaims } from "./oidc";
import {
  parseCookies,
  serializeCookie,
  clearCookie,
  sign,
  unsign,
} from "./cookies";
import {
  createSession,
  destroySession,
  getSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from "./session";
import { upsertUserFromClaims, getProfile, isAdmin } from "./service";

const TX_COOKIE = "oidc_tx";

function originFromRequest(request: Request): string {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

function redirect(location: string, headers: string[] = []): Response {
  const h = new Headers({ Location: location });
  for (const c of headers) h.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers: h });
}

// GET /api/login — begin OIDC login
export async function handleLogin(request: Request): Promise<Response> {
  const config = await getOidcConfig();
  const redirectUri = `${originFromRequest(request)}/api/callback`;

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const authUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
    prompt: "login consent",
  });

  const tx = sign(JSON.stringify({ codeVerifier, state, nonce, redirectUri }));
  const txCookie = serializeCookie(TX_COOKIE, tx, { maxAge: 600, sameSite: "Lax" });

  return redirect(authUrl.href, [txCookie]);
}

// GET /api/callback — finish OIDC login
export async function handleCallback(request: Request): Promise<Response> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const raw = unsign(cookies[TX_COOKIE]);
  if (!raw) return redirect("/auth?error=session", [clearCookie(TX_COOKIE)]);

  let tx: { codeVerifier: string; state: string; nonce: string; redirectUri: string };
  try {
    tx = JSON.parse(raw);
  } catch {
    return redirect("/auth?error=session", [clearCookie(TX_COOKIE)]);
  }

  try {
    const config = await getOidcConfig();
    const currentUrl = new URL(request.url);
    // Rebuild the URL on the public origin so it matches the registered redirect_uri.
    const publicUrl = new URL(currentUrl.pathname + currentUrl.search, originFromRequest(request));

    const tokens = await client.authorizationCodeGrant(config, publicUrl, {
      pkceCodeVerifier: tx.codeVerifier,
      expectedState: tx.state,
      expectedNonce: tx.nonce,
      idTokenExpected: true,
    });

    const claims = tokens.claims() as unknown as OidcClaims;
    await upsertUserFromClaims(claims);

    const accessExpiresAt = tokens.expires_in
      ? Math.floor(Date.now() / 1000) + tokens.expires_in
      : null;

    const sid = await createSession({
      userId: claims.sub,
      claims,
      refresh_token: tokens.refresh_token ?? null,
      access_expires_at: accessExpiresAt,
    });

    const sessionCookie = serializeCookie(SESSION_COOKIE, sid, {
      maxAge: SESSION_TTL_SECONDS,
      sameSite: "Lax",
    });

    return redirect("/", [sessionCookie, clearCookie(TX_COOKIE)]);
  } catch (err) {
    console.error("[auth] callback error", err);
    return redirect("/auth?error=login", [clearCookie(TX_COOKIE)]);
  }
}

// GET /api/logout — destroy session and end Replit session
export async function handleLogout(request: Request): Promise<Response> {
  const cookies = parseCookies(request.headers.get("cookie"));
  await destroySession(cookies[SESSION_COOKIE]);

  let endSession = "/";
  try {
    const config = await getOidcConfig();
    endSession = client.buildEndSessionUrl(config, {
      client_id: process.env.REPL_ID!,
      post_logout_redirect_uri: originFromRequest(request),
    }).href;
  } catch {
    endSession = "/";
  }

  return redirect(endSession, [clearCookie(SESSION_COOKIE)]);
}

// GET /api/auth/user — current user as JSON
export async function handleAuthUser(request: Request): Promise<Response> {
  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) {
    return Response.json({ authenticated: false });
  }
  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId),
  ]);
  return Response.json({
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
  "/api/login": handleLogin,
  "/api/callback": handleCallback,
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
