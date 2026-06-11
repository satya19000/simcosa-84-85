import { c as createServerRpc } from "./createServerRpc-CKIu9UKD.js";
import { r as requireAuth } from "./middleware-ffmSf9mS.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-w9OFQbuQ.js";
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
const updateMyProfile_createServerFn_handler = createServerRpc({
  id: "f9d52e4aeeff58384a28de1e963c08045faa37f05a3aef0d7e0d21d6d85acbde",
  name: "updateMyProfile",
  filename: "src/api/profile.ts"
}, (opts) => updateMyProfile.__executeServer(opts));
const updateMyProfile = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(updateMyProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const res = await query(`UPDATE profiles SET
         full_name = $2,
         phone = $3,
         whatsapp = $4,
         location = $5,
         profession = $6,
         bio = $7,
         updated_at = now()
       WHERE id = $1
       RETURNING id, full_name, photo_url, phone, whatsapp, email, location, profession, bio, approved`, [context.userId, data.full_name, data.phone ?? null, data.whatsapp ?? null, data.location ?? null, data.profession ?? null, data.bio ?? null]);
  return res.rows[0];
});
export {
  updateMyProfile_createServerFn_handler
};
