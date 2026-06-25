import { c as createServerRpc } from "./createServerRpc-BnSQkQN2.js";
import { r as requireApproved } from "./middleware-CgZVzenX.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-DHZcNGpa.js";
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
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const ALLOWED_DOC_TYPES = /* @__PURE__ */ new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"]);
const FILE_URL_SQL = `
  CASE
    WHEN g.file_url IS NOT NULL THEN g.file_url
    WHEN g.storage_path ~* '^https?://' THEN g.storage_path
    ELSE NULL
  END`;
const listGallery_createServerFn_handler = createServerRpc({
  id: "ed01fb10c2765f96827b4840cbb8c2b27108f6ad8d25060fc53d08de0bf38c9d",
  name: "listGallery",
  filename: "src/api/gallery.ts"
}, (opts) => listGallery.__executeServer(opts));
const listGallery = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listGallery_createServerFn_handler, async () => {
  const res = await query(`SELECT g.id, g.title, g.caption, g.location, g.taken_date, g.people, g.media_type, g.storage_path,
         ${FILE_URL_SQL} AS file_url,
         (${FILE_URL_SQL}) IS NOT NULL AS file_available,
         g.uploaded_by, g.created_at, g.sort_order,
         COALESCE((
           SELECT json_agg(json_build_object('user_id', gl.user_id))
           FROM gallery_likes gl WHERE gl.gallery_item_id = g.id
         ), '[]'::json) AS gallery_likes,
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', gc.id, 'comment', gc.comment, 'user_id', gc.user_id,
             'created_at', gc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY gc.created_at ASC)
           FROM gallery_comments gc
           LEFT JOIN profiles cp ON cp.id = gc.user_id
           WHERE gc.gallery_item_id = g.id AND gc.deleted_at IS NULL
         ), '[]'::json) AS gallery_comments
       FROM gallery_items g WHERE g.deleted_at IS NULL ORDER BY g.sort_order ASC, g.created_at DESC`);
  return res.rows;
});
function parseOptionalDate(value) {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed) || Number.isNaN(Date.parse(trimmed))) {
    throw new Error("Invalid date format. Please use YYYY-MM-DD.");
  }
  return trimmed;
}
const uploadGalleryItem_createServerFn_handler = createServerRpc({
  id: "99da4081e401e388a612265a7617d134a407e27c1d3a1e0ec44e469483df93a7",
  name: "uploadGalleryItem",
  filename: "src/api/gallery.ts"
}, (opts) => uploadGalleryItem.__executeServer(opts));
const uploadGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(uploadGalleryItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    url,
    storagePath,
    fileName,
    mimeType,
    fileSize,
    caption,
    title,
    location,
    takenDate,
    people
  } = data;
  if (!url || !storagePath || !fileName) {
    throw new Error("No file provided");
  }
  const mediaType = mimeType.startsWith("video") ? "video" : mimeType.startsWith("image") ? "image" : "document";
  if (mediaType === "image" && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
  }
  if (mediaType === "document" && !ALLOWED_DOC_TYPES.has(mimeType)) {
    throw new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX.");
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    throw new Error("This file is too large. Please upload a smaller image or compressed version.");
  }
  const safeTakenDate = parseOptionalDate(takenDate);
  await query(`INSERT INTO gallery_items
         (storage_path, caption, title, location, taken_date, people, media_type, mime, file_url, fb_storage_path, file_name, mime_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [fileName, caption || null, title || null, location || null, safeTakenDate, people || null, mediaType, mimeType || "application/octet-stream", url, storagePath, fileName, mimeType || "application/octet-stream", fileSize, context.userId]);
  return {
    ok: true
  };
});
const editGalleryItem_createServerFn_handler = createServerRpc({
  id: "d2aa529dc03095ba5fb8062e31c64f4747d3debe23225255c5648165506c6cc6",
  name: "editGalleryItem",
  filename: "src/api/gallery.ts"
}, (opts) => editGalleryItem.__executeServer(opts));
const editGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(editGalleryItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT uploaded_by FROM gallery_items WHERE id = $1 AND deleted_at IS NULL`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Item not found");
  if (row.uploaded_by !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  const safeTakenDate = parseOptionalDate(data.takenDate);
  await query(`UPDATE gallery_items
       SET title = $2, caption = $3, location = $4, taken_date = $5, people = $6
       WHERE id = $1`, [data.id, data.title || null, data.caption || null, data.location || null, safeTakenDate, data.people || null]);
  return {
    ok: true
  };
});
const replaceGalleryItemFile_createServerFn_handler = createServerRpc({
  id: "f434d61b2a8e37bba683c7432002f2d171b189ec353abe879561451f68917796",
  name: "replaceGalleryItemFile",
  filename: "src/api/gallery.ts"
}, (opts) => replaceGalleryItemFile.__executeServer(opts));
const replaceGalleryItemFile = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(replaceGalleryItemFile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    id,
    url,
    storagePath,
    fileName,
    mimeType,
    fileSize
  } = data;
  if (!url || !storagePath || !fileName) {
    throw new Error("No file provided");
  }
  const owned = await query(`SELECT uploaded_by, fb_storage_path FROM gallery_items WHERE id = $1 AND deleted_at IS NULL`, [id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Item not found");
  if (row.uploaded_by !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  const mediaType = mimeType.startsWith("video") ? "video" : mimeType.startsWith("image") ? "image" : "document";
  if (mediaType === "image" && !ALLOWED_IMAGE_TYPES.has(mimeType)) {
    throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
  }
  if (mediaType === "document" && !ALLOWED_DOC_TYPES.has(mimeType)) {
    throw new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX.");
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    throw new Error("This file is too large. Please upload a smaller image or compressed version.");
  }
  await query(`UPDATE gallery_items
       SET storage_path = $2, media_type = $3, mime = $4, file_url = $5, fb_storage_path = $6,
           file_name = $7, mime_type = $8, file_size = $9, data = NULL
       WHERE id = $1`, [id, fileName, mediaType, mimeType || "application/octet-stream", url, storagePath, fileName, mimeType || "application/octet-stream", fileSize]);
  return {
    ok: true,
    oldFbStoragePath: row.fb_storage_path
  };
});
const deleteGalleryItem_createServerFn_handler = createServerRpc({
  id: "bf94916a7551dc3f1057769ff3ad9eb88ed827898be8d0f59a90bac3ff0c2fc2",
  name: "deleteGalleryItem",
  filename: "src/api/gallery.ts"
}, (opts) => deleteGalleryItem.__executeServer(opts));
const deleteGalleryItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(deleteGalleryItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT uploaded_by, fb_storage_path FROM gallery_items WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Item not found");
  if (row.uploaded_by !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`DELETE FROM gallery_items WHERE id = $1`, [data.id]);
  return {
    ok: true,
    fbStoragePath: row.fb_storage_path
  };
});
const toggleGalleryLike_createServerFn_handler = createServerRpc({
  id: "e8b22e22f9df73a24e601ccfc157f0555c32de9b357c9e8edff53091a0f0e8ad",
  name: "toggleGalleryLike",
  filename: "src/api/gallery.ts"
}, (opts) => toggleGalleryLike.__executeServer(opts));
const toggleGalleryLike = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(toggleGalleryLike_createServerFn_handler, async ({
  data,
  context
}) => {
  if (data.liked) {
    await query(`DELETE FROM gallery_likes WHERE gallery_item_id = $1 AND user_id = $2`, [data.galleryItemId, context.userId]);
  } else {
    await query(`INSERT INTO gallery_likes (gallery_item_id, user_id) VALUES ($1, $2)
         ON CONFLICT (gallery_item_id, user_id) DO NOTHING`, [data.galleryItemId, context.userId]);
  }
  return {
    ok: true
  };
});
const addGalleryComment_createServerFn_handler = createServerRpc({
  id: "10dededf20386ec95a028d0cd78c51a07705fbb7e6f581ab3f13064362d24396",
  name: "addGalleryComment",
  filename: "src/api/gallery.ts"
}, (opts) => addGalleryComment.__executeServer(opts));
const addGalleryComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(addGalleryComment_createServerFn_handler, async ({
  data,
  context
}) => {
  const comment = data.comment.trim();
  if (!comment) throw new Error("Comment is required");
  await query(`INSERT INTO gallery_comments (gallery_item_id, user_id, comment) VALUES ($1, $2, $3)`, [data.galleryItemId, context.userId, comment]);
  return {
    ok: true
  };
});
const deleteGalleryComment_createServerFn_handler = createServerRpc({
  id: "22a707742f3fadf8fe1f913c7a6b6e591edfad34fdf675c9a7dfd8ac78a59c5d",
  name: "deleteGalleryComment",
  filename: "src/api/gallery.ts"
}, (opts) => deleteGalleryComment.__executeServer(opts));
const deleteGalleryComment = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(deleteGalleryComment_createServerFn_handler, async ({
  data,
  context
}) => {
  const owned = await query(`SELECT user_id FROM gallery_comments WHERE id = $1 AND deleted_at IS NULL`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Comment not found");
  if (row.user_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`UPDATE gallery_comments SET deleted_at = now() WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
export {
  addGalleryComment_createServerFn_handler,
  deleteGalleryComment_createServerFn_handler,
  deleteGalleryItem_createServerFn_handler,
  editGalleryItem_createServerFn_handler,
  listGallery_createServerFn_handler,
  replaceGalleryItemFile_createServerFn_handler,
  toggleGalleryLike_createServerFn_handler,
  uploadGalleryItem_createServerFn_handler
};
