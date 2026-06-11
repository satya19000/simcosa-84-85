import { c as createServerRpc } from "./createServerRpc-dCiwlzuh.js";
import { r as requireAuth } from "./middleware-BHUCx3Ft.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-iAkKsGcI.js";
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
const listMembers_createServerFn_handler = createServerRpc({
  id: "68129abdcf75ddcdb764d314aeef32f61bae884cfb55d07a85cb0f7f9f56ff6c",
  name: "listMembers",
  filename: "src/api/members.ts"
}, (opts) => listMembers.__executeServer(opts));
const listMembers = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listMembers_createServerFn_handler, async () => {
  const res = await query(`SELECT id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved
       FROM profiles ORDER BY full_name ASC`);
  return res.rows;
});
export {
  listMembers_createServerFn_handler
};
