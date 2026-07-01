import { createServerFn } from "@tanstack/react-start";
import { requireApproved, requireAdmin } from "../backend/auth/middleware";
import { query } from "../backend/db";
import { isAdmin, toSlug, PROFILE_COLUMNS, type ProfileRow } from "../backend/auth/service";

export interface MemberBlogItem {
  id: string;
  member_id: string;
  created_by: string;
  category: string;
  title: string | null;
  body: string | null;
  file_url: string | null;
  fb_storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  attachment_type: string | null;
  sort_order: number;
  visibility: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddMemberBlogItemInput {
  member_id: string;
  category: string;
  title?: string;
  body?: string;
  file_url?: string;
  fb_storage_path?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  attachment_type?: string;
  visibility?: string;
  is_published?: boolean;
}

export interface EditMemberBlogItemInput {
  id: string;
  title?: string | null;
  body?: string | null;
  file_url?: string | null;
  fb_storage_path?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  attachment_type?: string | null;
  visibility?: string | null;
  is_published?: boolean | null;
}

export interface MemberStorageUsage {
  total_bytes: number;
  file_count: number;
  photo_count: number;
  video_count: number;
  doc_count: number;
}

/** Look up a member's public profile by slug. Returns null if not found or not approved. */
export const getMemberBySlug = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }): Promise<ProfileRow | null> => {
    const res = await query<ProfileRow>(
      `SELECT ${PROFILE_COLUMNS} FROM profiles WHERE slug = $1 AND approval_status = 'approved'`,
      [data.slug],
    );
    return res.rows[0] ?? null;
  });

/** List published items for a member, optionally filtered by category. */
export const listMemberBlogItems = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .inputValidator((d: { member_id: string; category?: string }) => d)
  .handler(async ({ data, context }): Promise<MemberBlogItem[]> => {
    const admin = await isAdmin(context.userId);
    const isOwn = context.userId === data.member_id;
    const visible = admin || isOwn;

    const catClause = data.category ? `AND category = $2` : "";
    const pubClause = visible ? "" : "AND is_published = true";
    const params: unknown[] = [data.member_id];
    if (data.category) params.push(data.category);

    const res = await query<MemberBlogItem>(
      `SELECT * FROM member_blog_items WHERE member_id = $1 ${catClause} ${pubClause}
       ORDER BY sort_order ASC, created_at DESC`,
      params,
    );
    return res.rows;
  });

/**
 * Storage usage for a member's blog — total bytes consumed and per-type counts.
 * Only the member themselves or an admin can query.
 */
export const getMemberStorageUsage = createServerFn({ method: "GET" })
  .middleware([requireApproved])
  .inputValidator((d: { member_id: string }) => d)
  .handler(async ({ data, context }): Promise<MemberStorageUsage> => {
    const admin = await isAdmin(context.userId);
    const isOwn = context.userId === data.member_id;
    if (!isOwn && !admin) throw new Error("Not authorized");

    const res = await query<{
      total_bytes: string;
      file_count: string;
      photo_count: string;
      video_count: string;
      doc_count: string;
    }>(
      `SELECT
        COALESCE(SUM(file_size), 0) AS total_bytes,
        COUNT(*) FILTER (WHERE file_url IS NOT NULL)::int AS file_count,
        COUNT(*) FILTER (WHERE attachment_type = 'photo')::int AS photo_count,
        COUNT(*) FILTER (WHERE attachment_type = 'video')::int AS video_count,
        COUNT(*) FILTER (WHERE attachment_type = 'file')::int AS doc_count
       FROM member_blog_items WHERE member_id = $1`,
      [data.member_id],
    );
    const r = res.rows[0];
    return {
      total_bytes: Number(r.total_bytes),
      file_count: Number(r.file_count),
      photo_count: Number(r.photo_count),
      video_count: Number(r.video_count),
      doc_count: Number(r.doc_count),
    };
  });

/** Add a new item to a member's blog. Only the member or an admin can post. */
export const addMemberBlogItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: AddMemberBlogItemInput) => d)
  .handler(async ({ data, context }): Promise<MemberBlogItem> => {
    const admin = await isAdmin(context.userId);
    if (context.userId !== data.member_id && !admin) {
      throw new Error("Not authorized");
    }

    // Duplicate-file guard: same member + file_name + file_size + mime_type.
    if (data.file_name && data.file_size && data.mime_type) {
      const dup = await query(
        `SELECT 1 FROM member_blog_items
         WHERE member_id = $1 AND file_name = $2 AND file_size = $3 AND mime_type = $4 LIMIT 1`,
        [data.member_id, data.file_name, data.file_size, data.mime_type],
      );
      if (dup.rowCount! > 0) {
        throw new Error(`Duplicate file skipped: ${data.file_name}`);
      }
    }

    const res = await query<MemberBlogItem>(
      `INSERT INTO member_blog_items
        (member_id, created_by, category, title, body, file_url, fb_storage_path, file_name, mime_type, file_size, attachment_type, visibility, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        data.member_id,
        context.userId,
        data.category,
        data.title ?? null,
        data.body ?? null,
        data.file_url ?? null,
        data.fb_storage_path ?? null,
        data.file_name ?? null,
        data.mime_type ?? null,
        data.file_size ?? null,
        data.attachment_type ?? null,
        data.visibility ?? "members",
        data.is_published ?? true,
      ],
    );
    return res.rows[0];
  });

/** Edit an existing item. Only the item's member or an admin can edit. */
export const editMemberBlogItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: EditMemberBlogItemInput) => d)
  .handler(async ({ data, context }): Promise<MemberBlogItem> => {
    const existing = await query<{ member_id: string }>(
      `SELECT member_id FROM member_blog_items WHERE id = $1`,
      [data.id],
    );
    if (!existing.rows[0]) throw new Error("Item not found");

    const admin = await isAdmin(context.userId);
    if (context.userId !== existing.rows[0].member_id && !admin) {
      throw new Error("Not authorized");
    }

    const res = await query<MemberBlogItem>(
      `UPDATE member_blog_items SET
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
       RETURNING *`,
      [
        data.id,
        data.title ?? null,
        data.body ?? null,
        data.file_url ?? null,
        data.fb_storage_path ?? null,
        data.file_name ?? null,
        data.mime_type ?? null,
        data.file_size ?? null,
        data.attachment_type ?? null,
        data.visibility ?? null,
        data.is_published ?? null,
      ],
    );
    return res.rows[0];
  });

/** Delete a blog item. Only the member or an admin can delete. */
export const deleteMemberBlogItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<void> => {
    const existing = await query<{ member_id: string }>(
      `SELECT member_id FROM member_blog_items WHERE id = $1`,
      [data.id],
    );
    if (!existing.rows[0]) throw new Error("Item not found");

    const admin = await isAdmin(context.userId);
    if (context.userId !== existing.rows[0].member_id && !admin) {
      throw new Error("Not authorized");
    }
    await query(`DELETE FROM member_blog_items WHERE id = $1`, [data.id]);
  });

/** Admin: populate slugs for all approved members who don't have one yet. */
export const populateMemberSlugs = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<{ updated: number }> => {
    const missing = await query<{ id: string; full_name: string }>(
      `SELECT id, full_name FROM profiles WHERE slug IS NULL`,
    );
    let updated = 0;
    for (const row of missing.rows) {
      const base = toSlug(row.full_name) || "member";
      try {
        await query(
          `UPDATE profiles SET slug = (
            SELECT s FROM (
              SELECT $2 AS s WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE slug = $2)
              UNION ALL
              SELECT $2 || '-' || n FROM generate_series(2, 999) n
                WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE slug = $2 || '-' || n)
              LIMIT 1
            ) sub
          ) WHERE id = $1 AND slug IS NULL`,
          [row.id, base],
        );
        updated++;
      } catch {
        // skip on conflict
      }
    }
    return { updated };
  });

/** Admin: list all approved members with storage usage and blog item counts. */
export const adminListMemberBlogSummary = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const res = await query<{
      id: string;
      full_name: string;
      slug: string | null;
      photo_url: string | null;
      item_count: number;
      total_storage_bytes: number;
    }>(
      `SELECT p.id, p.full_name, p.slug, p.photo_url,
              COUNT(m.id)::int AS item_count,
              COALESCE(SUM(m.file_size), 0)::bigint AS total_storage_bytes
       FROM profiles p
       LEFT JOIN member_blog_items m ON m.member_id = p.id
       WHERE p.approval_status = 'approved'
       GROUP BY p.id, p.full_name, p.slug, p.photo_url
       ORDER BY total_storage_bytes DESC, p.full_name ASC`,
    );
    return res.rows;
  });
