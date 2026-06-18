import { createServerFn } from "@tanstack/react-start";
import { requireAuth, requireAdmin } from "../backend/auth/middleware";
import { query } from "../backend/db";

export type BlogCategory = "opinions" | "poems" | "health_tips" | "memories" | "events" | "general";

export interface BlogComment {
  id: string;
  body: string;
  user_id: string;
  created_at: string;
  profiles: { full_name: string } | null;
}

export interface BlogRow {
  id: string;
  author_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  category: BlogCategory;
  image_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  profiles: { full_name: string } | null;
  blog_likes: { user_id: string }[];
  blog_comments: BlogComment[];
}

const LIST_COLUMNS = `
  b.id, b.author_id, b.title, b.content, b.excerpt, b.category,
  CASE WHEN b.image_data IS NOT NULL THEN '/api/blogs/image/' || b.id ELSE NULL END AS image_url,
  b.is_featured, b.is_published, b.created_at, b.updated_at,
  json_build_object('full_name', p.full_name) AS profiles,
  COALESCE((
    SELECT json_agg(json_build_object('user_id', bl.user_id))
    FROM blog_likes bl WHERE bl.blog_id = b.id
  ), '[]'::json) AS blog_likes
`;

export const listBlogs = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { category?: BlogCategory } | undefined) => d)
  .handler(async ({ data, context }): Promise<BlogRow[]> => {
    const params: unknown[] = [];
    const conditions: string[] = [];
    if (!context.isAdmin) conditions.push(`(b.is_published = true OR b.author_id = $${params.push(context.userId)})`);
    if (data?.category) conditions.push(`b.category = $${params.push(data.category)}`);
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const res = await query<BlogRow>(
      `SELECT ${LIST_COLUMNS}, '[]'::json AS blog_comments
       FROM blogs b
       LEFT JOIN profiles p ON p.id = b.author_id
       ${where}
       ORDER BY b.is_featured DESC, b.created_at DESC`,
      params,
    );
    return res.rows;
  });

export const getBlog = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<BlogRow | null> => {
    const res = await query<BlogRow>(
      `SELECT ${LIST_COLUMNS},
         COALESCE((
           SELECT json_agg(json_build_object(
             'id', bc.id, 'body', bc.body, 'user_id', bc.user_id,
             'created_at', bc.created_at,
             'profiles', json_build_object('full_name', cp.full_name)
           ) ORDER BY bc.created_at ASC)
           FROM blog_comments bc
           LEFT JOIN profiles cp ON cp.id = bc.user_id
           WHERE bc.blog_id = b.id
         ), '[]'::json) AS blog_comments
       FROM blogs b
       LEFT JOIN profiles p ON p.id = b.author_id
       WHERE b.id = $1`,
      [data.id],
    );
    const row = res.rows[0];
    if (!row) return null;
    if (!row.is_published && row.author_id !== context.userId && !context.isAdmin) return null;
    return row;
  });

export const createBlog = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: FormData) => d)
  .handler(async ({ data, context }): Promise<{ ok: true; id: string }> => {
    const title = String(data.get("title") ?? "").trim();
    const content = String(data.get("content") ?? "").trim();
    const excerpt = String(data.get("excerpt") ?? "").trim();
    const category = String(data.get("category") ?? "general") as BlogCategory;
    if (!title || !content) throw new Error("Title and content are required");

    const file = data.get("image") as File | null;
    let imageBytes: Buffer | null = null;
    let imageMime: string | null = null;
    if (file && typeof file !== "string" && file.size > 0) {
      imageBytes = Buffer.from(await file.arrayBuffer());
      imageMime = file.type || "application/octet-stream";
    }

    const autoExcerpt = excerpt || content.slice(0, 180);
    const res = await query<{ id: string }>(
      `INSERT INTO blogs (author_id, title, content, excerpt, category, image_data, image_mime)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [context.userId, title, content, autoExcerpt, category, imageBytes, imageMime],
    );
    return { ok: true, id: res.rows[0].id };
  });

export const updateBlog = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string; title: string; content: string; excerpt?: string; category: BlogCategory }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ author_id: string }>(`SELECT author_id FROM blogs WHERE id = $1`, [data.id]);
    const row = owned.rows[0];
    if (!row) throw new Error("Blog not found");
    if (row.author_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(
      `UPDATE blogs SET title = $1, content = $2, excerpt = $3, category = $4, updated_at = now() WHERE id = $5`,
      [data.title, data.content, data.excerpt || data.content.slice(0, 180), data.category, data.id],
    );
    return { ok: true };
  });

export const deleteBlog = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const owned = await query<{ author_id: string }>(`SELECT author_id FROM blogs WHERE id = $1`, [data.id]);
    const row = owned.rows[0];
    if (!row) throw new Error("Blog not found");
    if (row.author_id !== context.userId && !context.isAdmin) throw new Error("Forbidden");

    await query(`DELETE FROM blogs WHERE id = $1`, [data.id]);
    return { ok: true };
  });

export const toggleBlogLike = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { blogId: string; liked: boolean }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (data.liked) {
      await query(`DELETE FROM blog_likes WHERE blog_id = $1 AND user_id = $2`, [data.blogId, context.userId]);
    } else {
      await query(
        `INSERT INTO blog_likes (blog_id, user_id) VALUES ($1, $2) ON CONFLICT (blog_id, user_id) DO NOTHING`,
        [data.blogId, context.userId],
      );
    }
    return { ok: true };
  });

export const addBlogComment = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((d: { blogId: string; body: string }) => d)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await query(`INSERT INTO blog_comments (blog_id, user_id, body) VALUES ($1, $2, $3)`, [
      data.blogId,
      context.userId,
      data.body,
    ]);
    return { ok: true };
  });

export const setBlogFeatured = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; featured: boolean }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`UPDATE blogs SET is_featured = $1 WHERE id = $2`, [data.featured, data.id]);
    return { ok: true };
  });

export const setBlogPublished = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((d: { id: string; published: boolean }) => d)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await query(`UPDATE blogs SET is_published = $1 WHERE id = $2`, [data.published, data.id]);
    return { ok: true };
  });
