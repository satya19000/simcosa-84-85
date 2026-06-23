import { c as createServerRpc } from "./createServerRpc-b_K6VtVl.js";
import { r as requireApproved } from "./middleware-eg2FaHUN.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-Lmx7-klY.js";
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
         m.author_name,
         COALESCE(NULLIF(m.author_name, ''), p.full_name, 'Member') AS display_name,
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
         ), '[]'::json) AS memory_comments,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', mi.id, 'image_url', mi.image_url, 'fb_storage_path', mi.fb_storage_path,
             'file_name', mi.file_name, 'sort_order', mi.sort_order
           ) ORDER BY mi.sort_order ASC, mi.created_at ASC)
           FROM memory_images mi WHERE mi.memory_id = m.id
         ), '[]'::json) AS images
       FROM memories m
       LEFT JOIN profiles p ON p.id = m.user_id
       ORDER BY m.created_at DESC`);
  return res.rows.map((row) => {
    if (row.images && row.images.length > 0) return row;
    if (row.image_url) {
      return {
        ...row,
        images: [{
          id: row.id,
          image_url: row.image_url,
          fb_storage_path: null,
          file_name: null,
          sort_order: 0
        }]
      };
    }
    return row;
  });
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
  const title = data.title ?? "";
  const body = data.body ?? "";
  if (!body.trim()) throw new Error("Memory body is required");
  const authorName = context.isAdmin ? data.authorName?.trim() || null : null;
  const res = await query(`INSERT INTO memories (user_id, title, body, author_name) VALUES ($1, $2, $3, $4) RETURNING id`, [context.userId, title || null, body, authorName]);
  return {
    ok: true,
    id: res.rows[0].id
  };
});
const addMemoryImages_createServerFn_handler = createServerRpc({
  id: "6e93f25e82133db9daf8acfce0d56aff0a445582b59c372a54c67e82ecf744b1",
  name: "addMemoryImages",
  filename: "src/api/memories.ts"
}, (opts) => addMemoryImages.__executeServer(opts));
const addMemoryImages = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(addMemoryImages_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT user_id FROM memories WHERE id = $1`, [data.memoryId]);
  const row = owned.rows[0];
  if (!row) throw new Error("Memory not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  if (!data.images || data.images.length === 0) return {
    ok: true
  };
  for (const [i, img] of data.images.entries()) {
    if (!img.mimeType || !ALLOWED_MEMORY_IMAGE_TYPES.has(img.mimeType)) {
      throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
    }
    if ((img.fileSize ?? 0) > MAX_MEMORY_IMAGE_BYTES) {
      throw new Error("This file is too large. Please upload a smaller image or compressed version.");
    }
    await query(`INSERT INTO memory_images (memory_id, image_url, fb_storage_path, file_name, mime_type, file_size, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [data.memoryId, img.url, img.storagePath || null, img.fileName || null, img.mimeType || null, img.fileSize ?? null, i]);
  }
  return {
    ok: true
  };
});
const deleteMemoryImage_createServerFn_handler = createServerRpc({
  id: "ff8f33c3a684d090734a57c181aec621c60f3fa8eb031e3e6328f337803d8a24",
  name: "deleteMemoryImage",
  filename: "src/api/memories.ts"
}, (opts) => deleteMemoryImage.__executeServer(opts));
const deleteMemoryImage = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(deleteMemoryImage_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT mi.fb_storage_path, m.user_id AS memory_user_id
       FROM memory_images mi JOIN memories m ON m.id = mi.memory_id
       WHERE mi.id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Image not found");
  if (row.memory_user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`DELETE FROM memory_images WHERE id = $1`, [data.id]);
  return {
    ok: true,
    fbStoragePath: row.fb_storage_path
  };
});
const reorderMemoryImages_createServerFn_handler = createServerRpc({
  id: "30fe95381bbaaa1da871f982ebe17dba82a7b7c15753d8862fd18c2896001643",
  name: "reorderMemoryImages",
  filename: "src/api/memories.ts"
}, (opts) => reorderMemoryImages.__executeServer(opts));
const reorderMemoryImages = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(reorderMemoryImages_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT user_id FROM memories WHERE id = $1`, [data.memoryId]);
  const row = owned.rows[0];
  if (!row) throw new Error("Memory not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  const existing = await query(`SELECT id FROM memory_images WHERE memory_id = $1`, [data.memoryId]);
  const existingIds = new Set(existing.rows.map((r) => r.id));
  if (data.orderedImageIds.length !== existingIds.size || !data.orderedImageIds.every((id) => existingIds.has(id))) {
    throw new Error("Photo list is out of date. Please refresh and try again.");
  }
  await Promise.all(data.orderedImageIds.map((id, i) => query(`UPDATE memory_images SET sort_order = $1 WHERE id = $2`, [i, id])));
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
const editMemory_createServerFn_handler = createServerRpc({
  id: "45d603cbe08dcb5867d92444fe2b0a2e47624b08cc9800beeb1954ee5e952368",
  name: "editMemory",
  filename: "src/api/memories.ts"
}, (opts) => editMemory.__executeServer(opts));
const editMemory = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(editMemory_createServerFn_handler, async ({
  data,
  context
}) => {
  if (!data.body.trim()) throw new Error("Memory body is required");
  const owned = await query(`SELECT user_id FROM memories WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Memory not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  const authorName = data.authorName?.trim() || null;
  await query(`UPDATE memories SET title = $1, body = $2, author_name = $3 WHERE id = $4`, [data.title || null, data.body, authorName, data.id]);
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
  const owned = await query(`SELECT user_id, fb_storage_path FROM memories WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Memory not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  const images = await query(`SELECT fb_storage_path FROM memory_images WHERE memory_id = $1`, [data.id]);
  await query(`DELETE FROM memories WHERE id = $1`, [data.id]);
  const fbStoragePaths = [row.fb_storage_path, ...images.rows.map((r) => r.fb_storage_path)].filter((p) => !!p);
  return {
    ok: true,
    fbStoragePaths
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
  addMemoryImages_createServerFn_handler,
  deleteComment_createServerFn_handler,
  deleteMemoryImage_createServerFn_handler,
  deleteMemory_createServerFn_handler,
  editMemory_createServerFn_handler,
  listMemories_createServerFn_handler,
  postMemory_createServerFn_handler,
  reorderMemoryImages_createServerFn_handler,
  toggleLike_createServerFn_handler
};
