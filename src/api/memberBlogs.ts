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

/** Add a new item to a member's blog. Only the member or an admin can post. */
export const addMemberBlogItem = createServerFn({ method: "POST" })
  .middleware([requireApproved])
  .inputValidator((d: AddMemberBlogItemInput) => d)
  .handler(async ({ data, context }): Promise<MemberBlogItem> => {
    const admin = await isAdmin(context.userId);
    if (context.userId !== data.member_id && !admin) {
      throw new Error("Not authorized");
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

/** Admin: list all approved members with their blog item counts. */
export const adminListMemberBlogSummary = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const res = await query<{
      id: string;
      full_name: string;
      slug: string | null;
      photo_url: string | null;
      item_count: number;
    }>(
      `SELECT p.id, p.full_name, p.slug, p.photo_url,
              COUNT(m.id)::int AS item_count
       FROM profiles p
       LEFT JOIN member_blog_items m ON m.member_id = p.id
       WHERE p.approval_status = 'approved'
       GROUP BY p.id, p.full_name, p.slug, p.photo_url
       ORDER BY p.full_name ASC`,
    );
    return res.rows;
  });
