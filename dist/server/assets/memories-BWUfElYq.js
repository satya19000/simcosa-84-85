import { c as createServerRpc } from "./createServerRpc-C_Agd_Kf.js";
import { r as requireApproved } from "./middleware-YB-48sp0.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-C6pwe8kY.js";
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
const MAX_MEMORY_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MEMORY_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const listMemories_createServerFn_handler = createServerRpc({
  id: "b0d6200ea808e73a221faf82c362ec58b2a03ca94d33e58347f805d9087f54ea",
  name: "listMemories",
  filename: "src/api/memories.ts"
}, (opts) => listMemories.__executeServer(opts));
const listMemories = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listMemories_createServerFn_handler, async () => {
  const res = await query(`SELECT
         m.id, m.user_id, m.title, m.body,
         CASE WHEN m.image_data IS NOT NULL THEN '/api/memories/image/' || m.id ELSE m.image_url END AS image_url,
         m.created_at,
         json_build_object('full_name', p.full_name) AS profiles,
         COALESCE((
           SELECT json_agg(json_build_object('user_id', ml.user_id))
           FROM memory_likes ml WHERE ml.memory_id = m.id
         ), '[]'::json) AS memory_likes,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', mc.id, 'body', mc.body, 'user_id', mc.user_id,
             'created_at', mc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY mc.created_at ASC)
           FROM memory_comments mc
           LEFT JOIN profiles cp ON cp.id = mc.user_id
           WHERE mc.memory_id = m.id
         ), '[]'::json) AS memory_comments
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.created_at DESC`);
  return res.rows;
});
const postMemory_createServerFn_handler = createServerRpc({
  id: "2065dd745dedbf088f44f3f3b299404d1ba89b3168af234c4c886a35fc6fb65c",
  name: "postMemory",
  filename: "src/api/memories.ts"
}, (opts) => postMemory.__executeServer(opts));
const postMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(postMemory_createServerFn_handler, async ({
  data,
  context
}) => {
  const title = String(data.get("title") ?? "");
  const body = String(data.get("body") ?? "");
  if (!body.trim()) throw new Error("Memory body is required");
  const file = data.get("image");
  let imageBytes = null;
  let imageMime = null;
  if (file && typeof file !== "string" && file.size > 0) {
    if (!ALLOWED_MEMORY_IMAGE_TYPES.has(file.type)) {
      throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
    }
    if (file.size > MAX_MEMORY_IMAGE_BYTES) {
      throw new Error("File is too large. Maximum size is 15MB.");
    }
    imageBytes = Buffer.from(await file.arrayBuffer());
    imageMime = file.type || "application/octet-stream";
  }
  await query(`INSERT INTO memories (user_id, title, body, image_data, image_mime) VALUES ($1, $2, $3, $4, $5)`, [context.userId, title || null, body, imageBytes, imageMime]);
  return {
    ok: true
  };
});
const toggleLike_createServerFn_handler = createServerRpc({
  id: "e184df1fbbb69e55cfb60a3d022bf393270215e9e1cd47bd7c7f3a37184b86f3",
  name: "toggleLike",
  filename: "src/api/memories.ts"
}, (opts) => toggleLike.__executeServer(opts));
const toggleLike = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(toggleLike_createServerFn_handler, async ({
  data,
  context
}) => {
  if (data.liked) {
    await query(`DELETE FROM memory_likes WHERE memory_id = $1 AND user_id = $2`, [data.memoryId, context.userId]);
  } else {
    await query(`INSERT INTO memory_likes (memory_id, user_id) VALUES ($1, $2)
         ON CONFLICT (memory_id, user_id) DO NOTHING`, [data.memoryId, context.userId]);
  }
  return {
    ok: true
  };
});
const addComment_createServerFn_handler = createServerRpc({
  id: "c8064c21e72cfcfa435af44c92e16331acf572539341a658c887017ee837bd30",
  name: "addComment",
  filename: "src/api/memories.ts"
}, (opts) => addComment.__executeServer(opts));
const addComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(addComment_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO memory_comments (memory_id, user_id, body) VALUES ($1, $2, $3)`, [data.memoryId, context.userId, data.body]);
  return {
    ok: true
  };
});
const deleteMemory_createServerFn_handler = createServerRpc({
  id: "09cfcc99efa88845cc1ccc7cf9d4f9ef041b252e9bf2970ae90789ca0b8437d4",
  name: "deleteMemory",
  filename: "src/api/memories.ts"
}, (opts) => deleteMemory.__executeServer(opts));
const deleteMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(deleteMemory_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT user_id FROM memories WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Memory not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`DELETE FROM memories WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
const deleteComment_createServerFn_handler = createServerRpc({
  id: "06cc2fd6d3b89226bc51ee370b1f16d39c146bff56aa0bbffff07020ee07c643",
  name: "deleteComment",
  filename: "src/api/memories.ts"
}, (opts) => deleteComment.__executeServer(opts));
const deleteComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(deleteComment_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT user_id FROM memory_comments WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Comment not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`DELETE FROM memory_comments WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
export {
  addComment_createServerFn_handler,
  deleteComment_createServerFn_handler,
  deleteMemory_createServerFn_handler,
  listMemories_createServerFn_handler,
  postMemory_createServerFn_handler,
  toggleLike_createServerFn_handler
};
