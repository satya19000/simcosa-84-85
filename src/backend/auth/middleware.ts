import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { parseCookies } from "./cookies";
import { getSession, SESSION_COOKIE } from "./session";
import { getProfile, isAdmin, isOwner, type ProfileRow } from "./service";

export interface AuthContext {
  userId: string;
  profile: ProfileRow | null;
  isAdmin: boolean;
  isOwner: boolean;
}

async function resolveAuth(): Promise<AuthContext> {
  const request = getRequest();
  const cookies = parseCookies(request?.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) {
    throw new Error("Unauthorized");
  }
  const [profile, admin, owner] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId),
    isOwner(session.userId),
  ]);
  return { userId: session.userId, profile, isAdmin: admin, isOwner: owner };
}

// Requires a logged-in user. Injects { userId, profile, isAdmin, isOwner } into context.
export const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    return next({ context: auth });
  },
);

// Requires an admin user (includes owners).
export const requireAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    if (!auth.isAdmin) {
      throw new Error("Forbidden: admin only");
    }
    return next({ context: auth });
  },
);

// Requires the owner role. Admins without owner role are rejected.
export const requireOwner = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    if (!auth.isOwner) {
      throw new Error("Forbidden: owner only");
    }
    return next({ context: auth });
  },
);

// Requires a logged-in, admin-approved member (admins always pass).
export const requireApproved = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    if (!auth.isAdmin && auth.profile?.approval_status !== "approved") {
      throw new Error("Forbidden: account pending approval");
    }
    return next({ context: auth });
  },
);
