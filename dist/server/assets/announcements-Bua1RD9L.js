import { c as createServerRpc } from "./createServerRpc-D3H7OvYJ.js";
import { r as requireApproved } from "./middleware-BOgvwp2I.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-DuXvkQ1j.js";
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
const listAnnouncements_createServerFn_handler = createServerRpc({
  id: "736de8b782851ebdb4801dcbe9836d3e6815003548e57853cf9218f934ed9589",
  name: "listAnnouncements",
  filename: "src/api/announcements.ts"
}, (opts) => listAnnouncements.__executeServer(opts));
const listAnnouncements = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listAnnouncements_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM announcements ORDER BY created_at DESC`);
  return res.rows;
});
export {
  listAnnouncements_createServerFn_handler
};
