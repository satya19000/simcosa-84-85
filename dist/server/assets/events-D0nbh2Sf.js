import { c as createServerRpc } from "./createServerRpc-W14MV-m3.js";
import { r as requireApproved } from "./middleware-QHgTRr5E.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-qvj13OZq.js";
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
const EVENT_COLUMNS = `
  id, title, description, location, event_date, end_date,
  COALESCE(cover_url, CASE WHEN cover_data IS NOT NULL THEN '/api/events/cover/' || id ELSE NULL END) AS cover_url,
  COALESCE(is_published, true) AS is_published,
  COALESCE(event_type, 'upcoming') AS event_type,
  COALESCE(rsvp_enabled, false) AS rsvp_enabled,
  external_link, sort_order, created_by, created_at
`;
const listEvents_createServerFn_handler = createServerRpc({
  id: "c18367e16cf8f111f4daaa26ad40eed19da06d504fa160ccb8fe783a450c11d4",
  name: "listEvents",
  filename: "src/api/events.ts"
}, (opts) => listEvents.__executeServer(opts));
const listEvents = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listEvents_createServerFn_handler, async () => {
  const res = await query(`SELECT ${EVENT_COLUMNS}
       FROM events
       WHERE COALESCE(is_published, true) = true
       ORDER BY COALESCE(sort_order, 0) ASC, event_date ASC`);
  return res.rows;
});
const listMyRsvps_createServerFn_handler = createServerRpc({
  id: "d96623ce34cfb7d798bae7bcefd4660c3ff339c9682e7ca3c56605e28ad2460f",
  name: "listMyRsvps",
  filename: "src/api/events.ts"
}, (opts) => listMyRsvps.__executeServer(opts));
const listMyRsvps = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listMyRsvps_createServerFn_handler, async ({
  context
}) => {
  const res = await query(`SELECT id, event_id, user_id, status FROM event_rsvps WHERE user_id = $1`, [context.userId]);
  return res.rows;
});
const listRsvpCounts_createServerFn_handler = createServerRpc({
  id: "f2448d31d2540ace4ac716a8e887c202de19f3cec36fb06652d3eaff1334e641",
  name: "listRsvpCounts",
  filename: "src/api/events.ts"
}, (opts) => listRsvpCounts.__executeServer(opts));
const listRsvpCounts = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listRsvpCounts_createServerFn_handler, async () => {
  const res = await query(`SELECT event_id, status FROM event_rsvps`);
  return res.rows;
});
const setRsvp_createServerFn_handler = createServerRpc({
  id: "7b26726927eb218882401f89a9d49cc74e6b3590180db87baaaafff30de3f1a0",
  name: "setRsvp",
  filename: "src/api/events.ts"
}, (opts) => setRsvp.__executeServer(opts));
const setRsvp = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(setRsvp_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO event_rsvps (event_id, user_id, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET status = EXCLUDED.status`, [data.eventId, context.userId, data.status]);
  return {
    ok: true
  };
});
export {
  listEvents_createServerFn_handler,
  listMyRsvps_createServerFn_handler,
  listRsvpCounts_createServerFn_handler,
  setRsvp_createServerFn_handler
};
