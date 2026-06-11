import { c as createServerRpc } from "./createServerRpc-Doxo6KrF.js";
import { r as requireAuth } from "./middleware-osnKys6y.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-Cjxmz0Wu.js";
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
const listGallery_createServerFn_handler = createServerRpc({
  id: "ed01fb10c2765f96827b4840cbb8c2b27108f6ad8d25060fc53d08de0bf38c9d",
  name: "listGallery",
  filename: "src/api/gallery.ts"
}, (opts) => listGallery.__executeServer(opts));
const listGallery = createServerFn({
  method: "GET"
}).middleware([requireAuth]).handler(listGallery_createServerFn_handler, async () => {
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
}).middleware([requireAuth]).inputValidator((d) => d).handler(uploadGalleryItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const file = data.get("file");
  const caption = String(data.get("caption") ?? "");
  if (!file || typeof file === "string") {
    throw new Error("No file provided");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type.startsWith("video") ? "video" : "image";
  await query(`INSERT INTO gallery_items (storage_path, caption, media_type, mime, data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`, [file.name, caption || null, mediaType, file.type || "application/octet-stream", bytes, context.userId]);
  return {
    ok: true
  };
});
export {
  listGallery_createServerFn_handler,
  uploadGalleryItem_createServerFn_handler
};
