import { c as createServerRpc } from "./createServerRpc-CNAweI2I.js";
import { r as requireApproved } from "./middleware-BmGJ8s8p.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-UEbKG0hA.js";
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
const listMySupport_createServerFn_handler = createServerRpc({
  id: "d9503064a034dc314a876b59e418cce3dd8fc81b5204142f1f4a165035863843",
  name: "listMySupport",
  filename: "src/api/support.ts"
}, (opts) => listMySupport.__executeServer(opts));
const listMySupport = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listMySupport_createServerFn_handler, async ({
  context
}) => {
  const res = await query(`SELECT * FROM support_requests WHERE user_id = $1 ORDER BY created_at DESC`, [context.userId]);
  return res.rows;
});
const createSupport_createServerFn_handler = createServerRpc({
  id: "f582a9077139cf9b573c808336f3561055edd028b40b857ec56af837b4771d0d",
  name: "createSupport",
  filename: "src/api/support.ts"
}, (opts) => createSupport.__executeServer(opts));
const createSupport = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(createSupport_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO support_requests (user_id, category, subject, message)
       VALUES ($1, $2, $3, $4)`, [context.userId, data.category, data.subject, data.message]);
  return {
    ok: true
  };
});
export {
  createSupport_createServerFn_handler,
  listMySupport_createServerFn_handler
};
