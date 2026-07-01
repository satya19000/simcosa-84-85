import { c as createServerRpc } from "./createServerRpc-B3SyJnYT.js";
import { b as requireAuth } from "./middleware-DS1paCMp.js";
import { q as query, P as PROFILE_COLUMNS } from "../server.js";
import { c as createServerFn } from "./server-DxzLTJPN.js";
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
         spouse_name = $8,
         clinic_or_hospital = $9,
         country_state = $10,
         batch_confirmed = COALESCE($11, batch_confirmed),
         updated_at = now()
       WHERE id = $1
       RETURNING ${PROFILE_COLUMNS}`, [context.userId, data.full_name, data.phone ?? null, data.whatsapp ?? null, data.location ?? null, data.profession ?? null, data.bio ?? null, data.spouse_name ?? null, data.clinic_or_hospital ?? null, data.country_state ?? null, data.batch_confirmed ?? null]);
  return res.rows[0];
});
const uploadProfilePhoto_createServerFn_handler = createServerRpc({
  id: "2babc95a84a186c74a261bb2201f89a96ad937e1592376ab57932ca022d0f5fe",
  name: "uploadProfilePhoto",
  filename: "src/api/profile.ts"
}, (opts) => uploadProfilePhoto.__executeServer(opts));
const uploadProfilePhoto = createServerFn({
  method: "POST"
}).middleware([requireAuth]).inputValidator((d) => d).handler(uploadProfilePhoto_createServerFn_handler, async ({
  data,
  context
}) => {
  const file = data.get("file");
  if (!file || typeof file === "string") {
    throw new Error("No file provided");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  await query(`INSERT INTO profile_photos (user_id, mime, data) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, created_at = now()`, [context.userId, file.type || "application/octet-stream", bytes]);
  const photoUrl = `/api/profile-photo/${context.userId}`;
  await query(`UPDATE profiles SET photo_url = $2, updated_at = now() WHERE id = $1`, [context.userId, photoUrl]);
  return {
    ok: true,
    photo_url: photoUrl
  };
});
export {
  updateMyProfile_createServerFn_handler,
  uploadProfilePhoto_createServerFn_handler
};
