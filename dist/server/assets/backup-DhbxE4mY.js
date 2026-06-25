import { c as createServerRpc } from "./createServerRpc-D0IWWqNI.js";
import { c as requireOwner } from "./middleware-4Fp-2rtQ.js";
import { q as query } from "../server.js";
import { c as createServerFn } from "./server-D4zmPpw9.js";
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
const ownerExportMembers_createServerFn_handler = createServerRpc({
  id: "a37bbb59df565528442e4fd811fab24f95cc73f850505ed328116174d606c697",
  name: "ownerExportMembers",
  filename: "src/api/backup.ts"
}, (opts) => ownerExportMembers.__executeServer(opts));
const ownerExportMembers = createServerFn({
  method: "GET"
}).middleware([requireOwner]).handler(ownerExportMembers_createServerFn_handler, async () => {
  const res = await query(`
      SELECT p.id, p.full_name, p.email, p.phone, p.whatsapp,
             p.location, p.profession, p.bio, p.approval_status,
             p.batch_confirmed, p.created_at
      FROM profiles p
      ORDER BY p.created_at ASC
    `);
  return res.rows;
});
const ownerExportMediaList_createServerFn_handler = createServerRpc({
  id: "077a1084a869d2d924a5b90e4cfeb9ec557666f93a1e105cafcfe2f772f60812",
  name: "ownerExportMediaList",
  filename: "src/api/backup.ts"
}, (opts) => ownerExportMediaList.__executeServer(opts));
const ownerExportMediaList = createServerFn({
  method: "GET"
}).middleware([requireOwner]).handler(ownerExportMediaList_createServerFn_handler, async () => {
  const [gallery, memories, blogs, events] = await Promise.all([query(`
        SELECT id, 'gallery' AS source, file_name, file_size, mime, file_url, fb_storage_path, created_at
        FROM gallery_items WHERE deleted_at IS NULL ORDER BY created_at ASC
      `), query(`
        SELECT id, 'memory_image' AS source, file_name, file_size, mime_type AS mime,
               image_url AS file_url, fb_storage_path, created_at
        FROM memory_images ORDER BY created_at ASC
      `), query(`
        SELECT id, 'blog' AS source, file_name, file_size, NULL AS mime,
               image_url AS file_url, fb_storage_path, created_at
        FROM blogs WHERE image_url IS NOT NULL OR fb_storage_path IS NOT NULL
        ORDER BY created_at ASC
      `), query(`
        SELECT id, 'event' AS source, file_name, file_size, NULL AS mime,
               cover_url AS file_url, fb_storage_path, created_at
        FROM events WHERE cover_url IS NOT NULL OR fb_storage_path IS NOT NULL
        ORDER BY created_at ASC
      `)]);
  return [...gallery.rows, ...memories.rows, ...blogs.rows, ...events.rows];
});
const ownerExportFullBackup_createServerFn_handler = createServerRpc({
  id: "823ded122bc2bbcabc674f42fdb452b2c4af21d6a346b0c5c3a3b2188d7d4286",
  name: "ownerExportFullBackup",
  filename: "src/api/backup.ts"
}, (opts) => ownerExportFullBackup.__executeServer(opts));
const ownerExportFullBackup = createServerFn({
  method: "GET"
}).middleware([requireOwner]).handler(ownerExportFullBackup_createServerFn_handler, async () => {
  const [members, memories, gallery, blogs, events, announcements, donations, expenses] = await Promise.all([query(`SELECT p.*, u.email AS auth_email FROM profiles p LEFT JOIN users u ON u.id = p.id ORDER BY p.created_at ASC`), query(`
          SELECT m.*, json_agg(json_build_object('id', mi.id, 'image_url', mi.image_url, 'file_name', mi.file_name, 'file_size', mi.file_size, 'sort_order', mi.sort_order) ORDER BY mi.sort_order ASC, mi.created_at ASC) FILTER (WHERE mi.id IS NOT NULL) AS images
          FROM memories m LEFT JOIN memory_images mi ON mi.memory_id = m.id
          GROUP BY m.id ORDER BY m.created_at ASC
        `), query(`SELECT * FROM gallery_items WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC`), query(`SELECT * FROM blogs ORDER BY created_at ASC`), query(`SELECT * FROM events ORDER BY event_date ASC`), query(`SELECT * FROM announcements ORDER BY created_at ASC`), query(`SELECT * FROM donations ORDER BY created_at ASC`), query(`SELECT * FROM expenses ORDER BY created_at ASC`)]);
  return {
    exported_at: (/* @__PURE__ */ new Date()).toISOString(),
    members: members.rows,
    memories: memories.rows,
    gallery: gallery.rows,
    blogs: blogs.rows,
    events: events.rows,
    announcements: announcements.rows,
    donations: donations.rows,
    expenses: expenses.rows
  };
});
export {
  ownerExportFullBackup_createServerFn_handler,
  ownerExportMediaList_createServerFn_handler,
  ownerExportMembers_createServerFn_handler
};
