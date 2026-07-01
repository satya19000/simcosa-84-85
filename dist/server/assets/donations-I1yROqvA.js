import { c as createServerRpc } from "./createServerRpc-hg8qXwMr.js";
import { r as requireApproved } from "./middleware-DcrzD3h4.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-Dnlq8-1X.js";
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
const listDonations_createServerFn_handler = createServerRpc({
  id: "bd2839912c2000330c0c97aecda6fa233bd9307559fa681d80581a21face4d1a",
  name: "listDonations",
  filename: "src/api/donations.ts"
}, (opts) => listDonations.__executeServer(opts));
const listDonations = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listDonations_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM donations ORDER BY donated_on DESC`);
  return res.rows;
});
const listExpenses_createServerFn_handler = createServerRpc({
  id: "d637ebf3b8dc0235d054a0d54d2dfda9e06880542cae18e88788262cd25d7a8d",
  name: "listExpenses",
  filename: "src/api/donations.ts"
}, (opts) => listExpenses.__executeServer(opts));
const listExpenses = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listExpenses_createServerFn_handler, async () => {
  const res = await query(`SELECT * FROM expenses ORDER BY spent_on DESC`);
  return res.rows;
});
export {
  listDonations_createServerFn_handler,
  listExpenses_createServerFn_handler
};
