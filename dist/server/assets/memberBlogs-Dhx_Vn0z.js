import { c as createServerRpc } from "./createServerRpc-W14MV-m3.js";
import { r as requireApproved, a as requireAdmin } from "./middleware-QHgTRr5E.js";
import { q as query, P as PROFILE_COLUMNS, i as isAdmin, t as toSlug } from "../server.js";
import { c as createServerFn } from "./server-qvj13OZq.js";
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
const getMemberBySlug_createServerFn_handler = createServerRpc({
  id: "ee27abc08ddb6ca4ce8d58fededf9321cdf198a2e4ae472865b426d862734fc4",
  name: "getMemberBySlug",
  filename: "src/api/memberBlogs.ts"
}, (opts) => getMemberBySlug.__executeServer(opts));
const getMemberBySlug = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(getMemberBySlug_createServerFn_handler, async ({
  data
}) => {
  const res = await query(`SELECT ${PROFILE_COLUMNS} FROM profiles WHERE slug = $1 AND approval_status = 'approved'`, [data.slug]);
  return res.rows[0] ?? null;
});
const listMemberBlogItems_createServerFn_handler = createServerRpc({
  id: "50bcd0f2b5eb3da7c3b0be35c6d0c3dd3d4d77f7930d18737dd2ed3d31fe0852",
  name: "listMemberBlogItems",
  filename: "src/api/memberBlogs.ts"
}, (opts) => listMemberBlogItems.__executeServer(opts));
const listMemberBlogItems = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(listMemberBlogItems_createServerFn_handler, async ({
  data,
  context
}) => {
  const admin = await isAdmin(context.userId);
  const isOwn = context.userId === data.member_id;
  const visible = admin || isOwn;
  const catClause = data.category ? `AND category = $2` : "";
  const pubClause = visible ? "" : "AND is_published = true";
  const params = [data.member_id];
  if (data.category) params.push(data.category);
  const res = await query(`SELECT * FROM member_blog_items WHERE member_id = $1 ${catClause} ${pubClause}
       ORDER BY sort_order ASC, created_at DESC`, params);
  return res.rows;
});
const getMemberStorageUsage_createServerFn_handler = createServerRpc({
  id: "ec5ed1538d442c48f370eea58ee14a48b6b22ed00c6f09984c55c8978c76d20b",
  name: "getMemberStorageUsage",
  filename: "src/api/memberBlogs.ts"
}, (opts) => getMemberStorageUsage.__executeServer(opts));
const getMemberStorageUsage = createServerFn({
  method: "GET"
}).middleware([requireApproved]).inputValidator((d) => d).handler(getMemberStorageUsage_createServerFn_handler, async ({
  data,
  context
}) => {
  const admin = await isAdmin(context.userId);
  const isOwn = context.userId === data.member_id;
  if (!isOwn && !admin) throw new Error("Not authorized");
  const res = await query(`SELECT
        COALESCE(SUM(file_size), 0) AS total_bytes,
        COUNT(*) FILTER (WHERE file_url IS NOT NULL)::int AS file_count,
        COUNT(*) FILTER (WHERE attachment_type = 'photo')::int AS photo_count,
        COUNT(*) FILTER (WHERE attachment_type = 'video')::int AS video_count,
        COUNT(*) FILTER (WHERE attachment_type = 'file')::int AS doc_count
       FROM member_blog_items WHERE member_id = $1`, [data.member_id]);
  const r = res.rows[0];
  return {
    total_bytes: Number(r.total_bytes),
    file_count: Number(r.file_count),
    photo_count: Number(r.photo_count),
    video_count: Number(r.video_count),
    doc_count: Number(r.doc_count)
  };
});
const addMemberBlogItem_createServerFn_handler = createServerRpc({
  id: "f8f0784d737eb9c9ea3872ddd172ac0928f9523920ac9490de11836707ed8640",
  name: "addMemberBlogItem",
  filename: "src/api/memberBlogs.ts"
}, (opts) => addMemberBlogItem.__executeServer(opts));
const addMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(addMemberBlogItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const admin = await isAdmin(context.userId);
  if (context.userId !== data.member_id && !admin) {
    throw new Error("Not authorized");
  }
  if (data.file_name && data.file_size && data.mime_type) {
    const dup = await query(`SELECT 1 FROM member_blog_items
         WHERE member_id = $1 AND file_name = $2 AND file_size = $3 AND mime_type = $4 LIMIT 1`, [data.member_id, data.file_name, data.file_size, data.mime_type]);
    if (dup.rowCount > 0) {
      throw new Error(`Duplicate file skipped: ${data.file_name}`);
    }
  }
  const res = await query(`INSERT INTO member_blog_items
        (member_id, created_by, category, title, body, file_url, fb_storage_path, file_name, mime_type, file_size, attachment_type, visibility, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`, [data.member_id, context.userId, data.category, data.title ?? null, data.body ?? null, data.file_url ?? null, data.fb_storage_path ?? null, data.file_name ?? null, data.mime_type ?? null, data.file_size ?? null, data.attachment_type ?? null, data.visibility ?? "members", data.is_published ?? true]);
  return res.rows[0];
});
const editMemberBlogItem_createServerFn_handler = createServerRpc({
  id: "b97dd90213707117aff72b2f21486f25f4378626d3eb755a9540a2a245c5adee",
  name: "editMemberBlogItem",
  filename: "src/api/memberBlogs.ts"
}, (opts) => editMemberBlogItem.__executeServer(opts));
const editMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(editMemberBlogItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const existing = await query(`SELECT member_id FROM member_blog_items WHERE id = $1`, [data.id]);
  if (!existing.rows[0]) throw new Error("Item not found");
  const admin = await isAdmin(context.userId);
  if (context.userId !== existing.rows[0].member_id && !admin) {
    throw new Error("Not authorized");
  }
  const res = await query(`UPDATE member_blog_items SET
        title = COALESCE($2, title),
        body = COALESCE($3, body),
        file_url = COALESCE($4, file_url),
        fb_storage_path = COALESCE($5, fb_storage_path),
        file_name = COALESCE($6, file_name),
        mime_type = COALESCE($7, mime_type),
        file_size = COALESCE($8, file_size),
        attachment_type = COALESCE($9, attachment_type),
        visibility = COALESCE($10, visibility),
        is_published = COALESCE($11, is_published),
        updated_at = now()
       WHERE id = $1
       RETURNING *`, [data.id, data.title ?? null, data.body ?? null, data.file_url ?? null, data.fb_storage_path ?? null, data.file_name ?? null, data.mime_type ?? null, data.file_size ?? null, data.attachment_type ?? null, data.visibility ?? null, data.is_published ?? null]);
  return res.rows[0];
});
const deleteMemberBlogItem_createServerFn_handler = createServerRpc({
  id: "444acdbddaa9000a21e1ea734b2985e61e85e80a3462221a57aaefa739c4f00f",
  name: "deleteMemberBlogItem",
  filename: "src/api/memberBlogs.ts"
}, (opts) => deleteMemberBlogItem.__executeServer(opts));
const deleteMemberBlogItem = createServerFn({
  method: "POST"
}).middleware([requireApproved]).inputValidator((d) => d).handler(deleteMemberBlogItem_createServerFn_handler, async ({
  data,
  context
}) => {
  const existing = await query(`SELECT member_id FROM member_blog_items WHERE id = $1`, [data.id]);
  if (!existing.rows[0]) throw new Error("Item not found");
  const admin = await isAdmin(context.userId);
  if (context.userId !== existing.rows[0].member_id && !admin) {
    throw new Error("Not authorized");
  }
  await query(`DELETE FROM member_blog_items WHERE id = $1`, [data.id]);
});
const populateMemberSlugs_createServerFn_handler = createServerRpc({
  id: "2e0a2b0b3c1a0cb19388f76deab7d3d3dba6e24e479e4dc10141d5df69aa7602",
  name: "populateMemberSlugs",
  filename: "src/api/memberBlogs.ts"
}, (opts) => populateMemberSlugs.__executeServer(opts));
const populateMemberSlugs = createServerFn({
  method: "POST"
}).middleware([requireAdmin]).handler(populateMemberSlugs_createServerFn_handler, async () => {
  const missing = await query(`SELECT id, full_name FROM profiles WHERE slug IS NULL`);
  let updated = 0;
  for (const row of missing.rows) {
    const base = toSlug(row.full_name) || "member";
    try {
      await query(`UPDATE profiles SET slug = (
            SELECT s FROM (
              SELECT $2 AS s WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE slug = $2)
              UNION ALL
              SELECT $2 || '-' || n FROM generate_series(2, 999) n
                WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE slug = $2 || '-' || n)
              LIMIT 1
            ) sub
          ) WHERE id = $1 AND slug IS NULL`, [row.id, base]);
      updated++;
    } catch {
    }
  }
  return {
    updated
  };
});
const adminListMemberBlogSummary_createServerFn_handler = createServerRpc({
  id: "33e0fefb67e0ee3425222e652505be3b239fe01f5cdbc7b34ce03bc031c569e6",
  name: "adminListMemberBlogSummary",
  filename: "src/api/memberBlogs.ts"
}, (opts) => adminListMemberBlogSummary.__executeServer(opts));
const adminListMemberBlogSummary = createServerFn({
  method: "GET"
}).middleware([requireAdmin]).handler(adminListMemberBlogSummary_createServerFn_handler, async () => {
  const res = await query(`SELECT p.id, p.full_name, p.slug, p.photo_url,
              COUNT(m.id)::int AS item_count,
              COALESCE(SUM(m.file_size), 0)::bigint AS total_storage_bytes
       FROM profiles p
       LEFT JOIN member_blog_items m ON m.member_id = p.id
       WHERE p.approval_status = 'approved'
       GROUP BY p.id, p.full_name, p.slug, p.photo_url
       ORDER BY total_storage_bytes DESC, p.full_name ASC`);
  return res.rows;
});
export {
  addMemberBlogItem_createServerFn_handler,
  adminListMemberBlogSummary_createServerFn_handler,
  deleteMemberBlogItem_createServerFn_handler,
  editMemberBlogItem_createServerFn_handler,
  getMemberBySlug_createServerFn_handler,
  getMemberStorageUsage_createServerFn_handler,
  listMemberBlogItems_createServerFn_handler,
  populateMemberSlugs_createServerFn_handler
};
