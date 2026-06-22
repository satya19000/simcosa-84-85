import { c as createServerRpc } from "./createServerRpc-BRLUwH9i.js";
import { r as requireApproved } from "./middleware-3n1ym3ek.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-D1b4KObJ.js";
import "./createMiddleware-BvN2ghIY.js";
import "node:crypto";
import "pg";
import "jose";
import "node:async_hooks";
import "h3-v2";
import "@tanstack/router-core";
import "seroval";
import "@tanstack/history";
import "@tanstack/router-core/ssr/client";
import "@tanstack/router-core/ssr/server";
import "react";
import "@tanstack/react-router";
import "react/jsx-runtime";
import "@tanstack/react-router/ssr/server";
const ONLINE_WINDOW = "3 minutes";
const pingPresence_createServerFn_handler = createServerRpc({
  id: "4a0ead3cec6486285774583b44af2b5d60120c63a2438195e889a1096fb0629d",
  name: "pingPresence",
  filename: "src/api/presence.ts"
}, (opts) => pingPresence.__executeServer(opts));
const pingPresence = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(pingPresence_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO member_presence (user_id, last_seen_at, current_page, updated_at)
       VALUES ($1, now(), $2, now())
       ON CONFLICT (user_id) DO UPDATE
         SET last_seen_at = now(), current_page = EXCLUDED.current_page, updated_at = now()`, [context.userId, data.currentPage || null]);
  return {
    ok: true
  };
});
const getOnlineMembers_createServerFn_handler = createServerRpc({
  id: "0d72731796e601cec9d0b35bf727e684c82f24b16263545df54b5d58b2055470",
  name: "getOnlineMembers",
  filename: "src/api/presence.ts"
}, (opts) => getOnlineMembers.__executeServer(opts));
const getOnlineMembers = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(getOnlineMembers_createServerFn_handler, async ({
  context
}) => {
  const res = await query(`SELECT p.id AS user_id, p.full_name, p.photo_url, p.email, mp.last_seen_at
       FROM member_presence mp
       JOIN profiles p ON p.id = mp.user_id
       WHERE mp.last_seen_at > now() - interval '${ONLINE_WINDOW}'
         AND p.approval_status = 'approved'
       ORDER BY mp.last_seen_at DESC`);
  const members = res.rows.map((m) => ({
    ...m,
    email: context.isAdmin ? m.email : null
  }));
  return {
    count: members.length,
    members
  };
});
export {
  getOnlineMembers_createServerFn_handler,
  pingPresence_createServerFn_handler
};
