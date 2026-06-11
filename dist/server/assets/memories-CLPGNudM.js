import { c as createServerRpc } from "./createServerRpc-Cri3D-SZ.js";
import { r as requireAuth } from "./middleware-ZjPIww5c.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-C6Duf4un.js";
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
const listMemories_createServerFn_handler = createServerRpc({
  id: "b0d6200ea808e73a221faf82c362ec58b2a03ca94d33e58347f805d9087f54ea",
  name: "listMemories",
  filename: "src/api/memories.ts"
}, (opts) => listMemories.__executeServer(opts));
const listMemories = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listMemories_createServerFn_handler, async () => {
  const res = await query(`SELECT
         m.id, m.title, m.body, m.image_url, m.created_at,
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
}).middleware([requireAuth]).inputValidator((d) => d).handler(postMemory_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO memories (user_id, title, body) VALUES ($1, $2, $3)`, [context.userId, data.title || null, data.body]);
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
}).middleware([requireAuth]).inputValidator((d) => d).handler(toggleLike_createServerFn_handler, async ({
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
}).middleware([requireAuth]).inputValidator((d) => d).handler(addComment_createServerFn_handler, async ({
  data,
  context
}) => {
  await query(`INSERT INTO memory_comments (memory_id, user_id, body) VALUES ($1, $2, $3)`, [data.memoryId, context.userId, data.body]);
  return {
    ok: true
  };
});
export {
  addComment_createServerFn_handler,
  listMemories_createServerFn_handler,
  postMemory_createServerFn_handler,
  toggleLike_createServerFn_handler
};
