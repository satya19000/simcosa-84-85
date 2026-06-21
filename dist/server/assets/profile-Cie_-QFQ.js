import { c as createSsrRpc } from "./createSsrRpc-Ddo47cL3.js";
import { b as requireAuth } from "./middleware-CpYjh-aW.js";
import { c as createServerFn } from "./server-Bk-SOkRu.js";
import "../server.js";
import "node:crypto";
import "pg";
import "jose";
import "./createMiddleware-BvN2ghIY.js";
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
const updateMyProfile = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("f9d52e4aeeff58384a28de1e963c08045faa37f05a3aef0d7e0d21d6d85acbde"));
const uploadProfilePhoto = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(createSsrRpc("2babc95a84a186c74a261bb2201f89a96ad937e1592376ab57932ca022d0f5fe"));
export {
  updateMyProfile,
  uploadProfilePhoto
};
