import { p as parseCookies, g as getSession, S as SESSION_COOKIE, a as getProfile, i as isAdmin } from "../server.js";
import { c as createMiddleware } from "./createMiddleware-BvN2ghIY.js";
import { g as getRequest } from "./server-BjolCwuX.js";
async function resolveAuth() {
  const request = getRequest();
  const cookies = parseCookies(request?.headers.get("cookie"));
  const session = await getSession(cookies[SESSION_COOKIE]);
  if (!session) {
    throw new Error("Unauthorized");
  }
  const [profile, admin] = await Promise.all([
    getProfile(session.userId),
    isAdmin(session.userId)
  ]);
  return { userId: session.userId, profile, isAdmin: admin };
}
const requireAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    return next({ context: auth });
  }
);
const requireAdmin = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    if (!auth.isAdmin) {
      throw new Error("Forbidden: admin only");
    }
    return next({ context: auth });
  }
);
const requireApproved = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const auth = await resolveAuth();
    if (!auth.isAdmin && auth.profile?.approval_status !== "approved") {
      throw new Error("Forbidden: account pending approval");
    }
    return next({ context: auth });
  }
);
export {
  requireApproved as a,
  requireAdmin as b,
  requireAuth as r
};
