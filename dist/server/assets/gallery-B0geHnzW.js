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
  const res = await query(`SELECT id, title, caption, media_type, storage_path, uploaded_by, created_at
       FROM gallery_items ORDER BY created_at DESC`);
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
  const file = data.get("file");
  const caption = String(data.get("caption") ?? "");
  if (!file || typeof file === "string") {
    throw new Error("No file provided");
  }
  const mediaType = file.type.startsWith("video") ? "video" : file.type.startsWith("image") ? "image" : "document";
  if (mediaType === "image" && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Unsupported image format. Please use JPG, PNG, or WEBP.");
  }
  if (mediaType === "document" && !ALLOWED_DOC_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Maximum size is 15MB.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  await query(`INSERT INTO gallery_items (storage_path, caption, media_type, mime, data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`, [file.name, caption || null, mediaType, file.type || "application/octet-stream", bytes, context.userId]);
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
  const owned = await query(`SELECT uploaded_by FROM gallery_items WHERE id = $1`, [data.id]);
  const row = owned.rows[0];
  if (!row) throw new Error("Item not found");
  if (row.uploaded_by !== context.userId && !context.isAdmin) throw new Error("Forbidden");
  await query(`DELETE FROM gallery_items WHERE id = $1`, [data.id]);
  return {
    ok: true
  };
});
export {
  deleteGalleryItem_createServerFn_handler,
  listGallery_createServerFn_handler,
  uploadGalleryItem_createServerFn_handler
};
