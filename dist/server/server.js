import crypto from "node:crypto";
import pg from "pg";
import { jwtVerify, createRemoteJWKSet } from "jose";
let lastCapturedError;
const TTL_MS = 5e3;
function record(error) {
  lastCapturedError = { error, at: Date.now() };
}
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record(event.error ?? event));
  globalThis.addEventListener(
    "unhandledrejection",
    (event) => record(event.reason)
  );
}
function consumeLastCapturedError() {
  if (!lastCapturedError) return void 0;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = void 0;
    return void 0;
  }
  const { error } = lastCapturedError;
  lastCapturedError = void 0;
  return error;
}
function renderErrorPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}
function serializeCookie(name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.maxAge != null) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  if (opts.httpOnly !== false) parts.push("HttpOnly");
  if (opts.secure !== false) parts.push("Secure");
  parts.push(`SameSite=${opts.sameSite ?? "Lax"}`);
  return parts.join("; ");
}
function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
const { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function query(text, params) {
  return pool.query(text, params);
}
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
async function createSession(data) {
  const sid = crypto.randomBytes(32).toString("base64url");
  const expire = new Date(Date.now() + SESSION_TTL_SECONDS * 1e3);
  await query("INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)", [
    sid,
    JSON.stringify(data),
    expire
  ]);
  return sid;
}
async function getSession(sid) {
  if (!sid) return null;
  const res = await query(
    "SELECT sess, expire FROM sessions WHERE sid = $1",
    [sid]
  );
  const row = res.rows[0];
  if (!row) return null;
  if (new Date(row.expire).getTime() < Date.now()) {
    await destroySession(sid);
    return null;
  }
  return row.sess;
}
async function destroySession(sid) {
  if (!sid) return;
  await query("DELETE FROM sessions WHERE sid = $1", [sid]);
}
const SESSION_COOKIE = "sid";
const RESEND_API_URL = "https://api.resend.com/emails";
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
async function sendNewMemberAdminNotification(adminEmails, member) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn(
      "[email] RESEND_API_KEY/ADMIN_FROM_EMAIL not configured — skipping new-member admin notification"
    );
    return;
  }
  if (adminEmails.length === 0) {
    console.warn("[email] no admin emails found — skipping new-member admin notification");
    return;
  }
  const approvalLink = "https://simcosa-84-85.vercel.app/admin";
  const fields = [
    ["Name", member.name],
    ["Email", member.email ?? "—"],
    ["Mobile", "—"],
    ["City", "—"],
    ["Profession", "—"],
    ["Signup time", member.signupTime.toUTCString()]
  ];
  const html = `
    <h2>New SIMCOSA member awaiting approval</h2>
    <table cellpadding="6" cellspacing="0">
      ${fields.map(([label, value]) => `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`).join("")}
    </table>
    <p><a href="${approvalLink}">Review and approve at ${approvalLink}</a></p>
  `;
  const text = [
    ...fields.map(([label, value]) => `${label}: ${value}`),
    "",
    `Approve at: ${approvalLink}`
  ].join("\n");
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from,
        to: adminEmails,
        subject: "New SIMCOSA member awaiting approval",
        html,
        text
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn("[email] Resend request failed:", res.status, detail);
    }
  } catch (err) {
    console.warn("[email] failed to send new-member admin notification:", err);
  }
}
async function upsertUserFromClaims(claims) {
  const id = claims.sub;
  const email = claims.email ?? null;
  const firstName = claims.first_name ?? null;
  const lastName = claims.last_name ?? null;
  const image = claims.profile_image_url ?? null;
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || email || "Batchmate";
  const isNewSignup = await withTransaction(async (c) => {
    if (email) {
      await c.query(`DELETE FROM users WHERE email = $1 AND id <> $2`, [email, id]);
    }
    await c.query(
      `INSERT INTO users (id, email, first_name, last_name, profile_image_url, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         profile_image_url = EXCLUDED.profile_image_url,
         updated_at = now()`,
      [id, email, firstName, lastName, image]
    );
    const profileInsert = await c.query(
      `INSERT INTO profiles (id, full_name, email, photo_url, approved, approval_status)
       VALUES ($1, $2, $3, $4, false, 'pending')
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [id, fullName, email, image]
    );
    await c.query(
      `INSERT INTO user_roles (user_id, role) VALUES ($1, 'member')
       ON CONFLICT (user_id, role) DO NOTHING`,
      [id]
    );
    return profileInsert.rowCount > 0;
  });
  if (isNewSignup) {
    const admins = await query(
      `SELECT u.email FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE ur.role = 'admin'`
    );
    const adminEmails = admins.rows.map((r) => r.email).filter((e) => !!e);
    void sendNewMemberAdminNotification(adminEmails, {
      name: fullName,
      email,
      signupTime: /* @__PURE__ */ new Date()
    });
  }
}
const PROFILE_COLUMNS = `id, full_name, photo_url, phone, whatsapp, email, location, profession, bio,
  spouse_name, clinic_or_hospital, country_state, batch_confirmed, approved, approval_status,
  approved_by, approved_at, rejection_reason, created_at`;
async function getProfile(userId) {
  const res = await query(
    `SELECT ${PROFILE_COLUMNS} FROM profiles WHERE id = $1`,
    [userId]
  );
  return res.rows[0] ?? null;
}
async function isAdmin(userId) {
  const res = await query(
    `SELECT 1 FROM user_roles WHERE user_id = $1 AND role = 'admin' LIMIT 1`,
    [userId]
  );
  return res.rowCount > 0;
}
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);
async function verifyFirebaseToken(idToken) {
  if (!PROJECT_ID) {
    throw new Error("VITE_FIREBASE_PROJECT_ID must be set to verify Firebase tokens");
  }
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID
  });
  const p = payload;
  const uid = p.sub || p.user_id;
  if (!uid) throw new Error("Invalid Firebase token: missing subject");
  const name = (p.name ?? "").trim();
  let firstName = null;
  let lastName = null;
  if (name) {
    const parts = name.split(/\s+/);
    firstName = parts.shift() ?? null;
    lastName = parts.length ? parts.join(" ") : null;
  }
  return {
    sub: uid,
    email: p.email ?? null,
    first_name: firstName,
    last_name: lastName,
    profile_image_url: p.picture ?? null
  };
}
function json(body, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { ...init, headers });
}
async function handleSession(request) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }
  let idToken;
  try {
    const body = await request.json();
    idToken = body?.idToken;
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!idToken) return json({ error: "Missing idToken" }, { status: 400 });
  let claims;
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
    sameSite: "Lax"
  });
  return json({ ok: true }, { headers: { "Set-Cookie": cookie } });
}
async function handleLogout(request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  await destroySession(cookies[SESSION_COOKIE]);
  return json({ ok: true }, { headers: { "Set-Cookie": clearCookie(SESSION_COOKIE) } });
}
async function handleAuthUser(request) {
  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) {
    return json({ authenticated: false });
  }
  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId)
  ]);
  return json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.claims.email ?? null,
      first_name: session.claims.first_name ?? null,
      last_name: session.claims.last_name ?? null,
      profile_image_url: session.claims.profile_image_url ?? null
    },
    profile,
    isAdmin: admin
  });
}
const ROUTES = {
  "/api/session": handleSession,
  "/api/logout": handleLogout,
  "/api/auth/user": handleAuthUser
};
async function handleAuthRoute(request) {
  const { pathname } = new URL(request.url);
  const handler = ROUTES[pathname];
  if (!handler) return null;
  return handler(request);
}
async function serveGallery(request) {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/api\/gallery\/([^/]+)$/);
  if (!match) return null;
  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId)
  ]);
  if (!admin && profile?.approval_status !== "approved") {
    return new Response("Forbidden", { status: 403 });
  }
  const id = decodeURIComponent(match[1]);
  const res = await query(
    `SELECT data, mime FROM gallery_items WHERE id = $1`,
    [id]
  );
  const row = res.rows[0];
  if (!row || !row.data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    status: 200,
    headers: {
      "Content-Type": row.mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600"
    }
  });
}
async function serveBlogImage(request) {
  const { pathname } = new URL(request.url);
  const match = pathname.match(/^\/api\/blogs\/image\/([^/]+)$/);
  if (!match) return null;
  const cookies = parseCookies(request.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId)
  ]);
  if (!admin && profile?.approval_status !== "approved") {
    return new Response("Forbidden", { status: 403 });
  }
  const id = decodeURIComponent(match[1]);
  const res = await query(
    `SELECT image_data, image_mime FROM blogs WHERE id = $1`,
    [id]
  );
  const row = res.rows[0];
  if (!row || !row.image_data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.image_data), {
    status: 200,
    headers: {
      "Content-Type": row.image_mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600"
    }
  });
}
async function serveProfilePhoto(request) {
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
      isAdmin(session.userId)
    ]);
    if (!admin && profile?.approval_status !== "approved") {
      return new Response("Forbidden", { status: 403 });
    }
  }
  const res = await query(
    `SELECT data, mime FROM profile_photos WHERE user_id = $1`,
    [userId]
  );
  const row = res.rows[0];
  if (!row || !row.data) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    status: 200,
    headers: {
      "Content-Type": row.mime ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600"
    }
  });
}
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./assets/server-voIeAJtn.js").then((n) => n.s).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;
  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }
  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
const server = {
  async fetch(request, env, ctx) {
    try {
      const authResponse = await handleAuthRoute(request);
      if (authResponse) return authResponse;
      const galleryResponse = await serveGallery(request);
      if (galleryResponse) return galleryResponse;
      const blogImageResponse = await serveBlogImage(request);
      if (blogImageResponse) return blogImageResponse;
      const profilePhotoResponse = await serveProfilePhoto(request);
      if (profilePhotoResponse) return profilePhotoResponse;
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }
  }
};
export {
  PROFILE_COLUMNS as P,
  SESSION_COOKIE as S,
  getProfile as a,
  server as default,
  getSession as g,
  isAdmin as i,
  parseCookies as p,
  query as q,
  renderErrorPage as r,
  withTransaction as w
};
