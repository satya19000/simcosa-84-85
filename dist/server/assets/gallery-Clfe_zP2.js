import { c as createServerRpc } from "./createServerRpc-2_zVu1d4.js";
import { r as requireApproved } from "./middleware-D6e_gS7X.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-B29Zb1Az.js";
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
const listGallery_createServerFn_handler = createServerRpc({
  id: "ed01fb10c2765f96827b4840cbb8c2b27108f6ad8d25060fc53d08de0bf38c9d",
  name: "listGallery",
  filename: "src/api/gallery.ts"
}, (opts) => listGallery.__executeServer(opts));
const listGallery = createServerFn({
  method: "GET"
}).middleware([requireApproved]).handler(listGallery_createServerFn_handler, async () => {
  const res = await query(`SELECT id, title, caption, media_type, storage_path,
         COALESCE(file_url, CASE WHEN data IS NOT NULL THEN '/api/gallery/'||id ELSE NULL END) AS file_url,
         uploaded_by, created_at
       FROM gallery_items WHERE deleted_at IS NULL ORDER BY created_at DESC`);
  return res.rows;
});
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
    caption
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
  await query(`INSERT INTO gallery_items
         (storage_path, caption, media_type, mime, file_url, fb_storage_path, file_name, mime_type, file_size, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [fileName, caption || null, mediaType, mimeType || "application/octet-stream", url, storagePath, fileName, mimeType || "application/octet-stream", fileSize, context.userId]);
  return {
    ok: true
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
export {
  deleteGalleryItem_createServerFn_handler,
  listGallery_createServerFn_handler,
  uploadGalleryItem_createServerFn_handler
};
